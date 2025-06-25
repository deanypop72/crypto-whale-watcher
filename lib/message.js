const request = require('request-promise-native');
const config = require('../config');
let prev_msg_id = 0;
let prev_to_id = "";
let prev_mo_id = "";
let prev_quantity = 0;
// let test = false;

let CHAT_ID = config.CHAT_ID;

// Message queue system to handle rate limiting
const messageQueue = [];
let isProcessingQueue = false;
const MESSAGE_DELAY = 2000; // 2 seconds delay between messages
const MAX_RETRIES = 3;

const processMessageQueue = async () => {
  if (isProcessingQueue || messageQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (messageQueue.length > 0) {
    const { chatOptions, resolve, reject, retryCount = 0 } = messageQueue.shift();
    
    try {
      const result = await sendMessageInternal(chatOptions);
      
      if (result.ok) {
        resolve(result);
      } else if (result.error && result.error.message && result.error.message.includes('429')) {
        // Rate limited - put back in queue with exponential backoff
        if (retryCount < MAX_RETRIES) {
          const delay = Math.min(5000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
          console.log(`Rate limited, retrying in ${delay}ms (attempt ${retryCount + 1})`);
          
          setTimeout(() => {
            messageQueue.unshift({ chatOptions, resolve, reject, retryCount: retryCount + 1 });
          }, delay);
        } else {
          console.log('Max retries exceeded for message');
          reject(result.error);
        }
      } else {
        reject(result.error || new Error('Unknown error'));
      }
    } catch (error) {
      console.log('Error sending message:', error.message);
      reject(error);
    }
    
    // Wait before processing next message
    if (messageQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, MESSAGE_DELAY));
    }
  }
  
  isProcessingQueue = false;
};

const sendMessageInternal = (chatOptions) => {
  return request(chatOptions)
  .catch(function (err) {
    console.log("Main:", err.statusCode, "-", err.message);
    return { ok: false, error: err };
  });
};

const sendMessage = (chatOptions) => {
  return new Promise((resolve, reject) => {
    messageQueue.push({ chatOptions, resolve, reject });
    processMessageQueue();
  });
};

const build = (messageObj) => {
  let event = messageObj.event;
  let symbol = messageObj.symbol;
  let quantity = typeof messageObj.quantity !== 'undefined' ? parseFloat(messageObj.quantity) : undefined;
  let price = typeof messageObj.price !== 'undefined' ? parseFloat(messageObj.price) : undefined;
  let exchange = messageObj.exchange;
  let to_id = undefined;
  let mo_id = undefined;
  let isAggregate = messageObj.isAggregate;
  let encoded_message = "";
  let aggr_msg = "";
  let order_ids = "";
  let special_msg = "";
  let base = "";
  let currency = "";
  const formatNumber = (num, decimals = 8) => {
    return parseFloat(num).toFixed(decimals).replace(/\.0+$|(?<=\.[0-9]*?)0+$/g, '').replace(/\.$/, '');
  };
  if(symbol) {
    let unformatted = symbol.replace("-","");
    base = unformatted.substr((symbol.substr(-4) == "USDT"?-4:-3));
    // base = (/^USD(T)?$/.test(base)?"$":base);
    currency = unformatted.replace(base, "");
  }
  
  if(exchange == 'gdax') {
    to_id = messageObj.taker_order_id;
    mo_id = messageObj.maker_order_id;
    let taker = "";
    let maker = "";
    if(quantity < 0) {
      taker = "seller";
      maker = "buyer";
    } else {
      taker = "buyer";
      maker = "seller";
    }
    order_ids = `\n${taker}-orderId: ${to_id.substring(to_id.length - 4)}\n${maker}-orderId: ${mo_id.substring(mo_id.length - 4)}`;
    aggr_msg = isAggregate?"\n**Aggregated**":"";
    special_msg = order_ids + aggr_msg;
  }
  
  if(event == "VOLUME") {
    let type = messageObj.type;
    let side = messageObj.side;
    let size = Math.round(messageObj.size);
    if(typeof type == "object") {
      special_msg = `( order of ${formatNumber(type[1])} ${currency} placed at ${formatNumber(type[0], 2)} ${base})\n`;
    }
    encoded_message = encodeURIComponent(`*VOLUME:*\n${symbol} (${exchange})\n${special_msg}Total ${formatNumber(quantity)} ${currency}, which is around ${size} times bigger than counterpart`);

  }
  else if(event == "TRADE") {
    if(quantity < 0)
      encoded_message = encodeURIComponent(`*TRADE:*\n${symbol} (${exchange})\nSold ${formatNumber(quantity*-1)} at ${formatNumber(price, 2)} ${base}${special_msg}`);
    else
      encoded_message = encodeURIComponent(`*TRADE:*\n${symbol} (${exchange})\nBought ${formatNumber(quantity)} at ${formatNumber(price, 2)} ${base}${special_msg}`);
  }
  else if(event == "limit-change") {
    encoded_message = encodeURIComponent('*Limit change requested.*');
  } 
  else if(event == "WD") {
    let side = messageObj.side;
    encoded_message = encodeURIComponent(`*VOLUME:*\n${symbol} (${exchange})\n${side} volume is down compared to before`);
  }
  
  if(config.TESTING)
    CHAT_ID = config.TEST_CHAT_ID;

  var chatOptions = {
    uri: `https://api.telegram.org/bot${config.BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encoded_message}`,
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true
  };
  
  if(to_id == prev_to_id || mo_id == prev_mo_id) {
    if(quantity > prev_quantity) {
      chatOptions.uri = `https://api.telegram.org/bot${config.BOT_TOKEN}/editMessageText?chat_id=${CHAT_ID}&message_id=${prev_msg_id}&text=${encoded_message}`;
      sendMessage(chatOptions)
      .then((res) => {
        // console.log("This is res:", res);
        if(res.ok) {
          prev_msg_id = res.result.message_id;
          prev_quantity = quantity;
        } else {
          console.log("Message update failed");
        }
        // console.log(res.result.text+" updated");
      })
      .catch((err) => {
        console.log("Message update error:", err.message);
      });
    }
  } else {
    // console.log(encoded_message);
    sendMessage(chatOptions)
    .then((res) => {
      if(res && res.ok) {
        prev_msg_id = res.result.message_id;
        prev_quantity = quantity;
      } else {
        console.log("Message sending failed");
      }
      // console.log(res.result.text+" sent");
    })
    .catch((err) => {
      console.log("Message sending error:", err.message);
    });
  }
  
  if(to_id != undefined && mo_id != undefined) {
    prev_to_id = to_id;
    prev_mo_id = mo_id;
  }
}

module.exports = build;