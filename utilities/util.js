let util = {};

util.shortenAmazonURL = (URL) => {
  if (URL.includes("/ref=")) {
    URL = URL.split("/ref=")[0];
  }
  if (URL.includes("?pd_rd_w=")) {
    URL = URL.split("?pd_rd_w=")[0];
  }
  return URL;
};

util.shortenFlipkartURL = (URL) => {
  if (URL.includes("?pid=")) {
    URL = URL.split("?pid=")[0];
  }
  return URL;
};

util.getUrlsList = (products) => {
  let urlsList = [];
  products.forEach((element) => {
    urlsList.push(element.url);
  });
  return urlsList;
};

util.getNotifyData = (products, newData) => {
  let notifyData = [];
  products.forEach((element) => {
    let notifyObj = {};
    if (
      element &&
      element.url &&
      element.price &&
      element.price.discountPrice
    ) {
      let obj = newData.find((o) => o.url == element.url);
      if (obj.currentPrice < element.price.discountPrice) {
        notifyObj.date = Date.now().toString();
        notifyObj.image = element.image;
        notifyObj.title = element.title;
        notifyObj.url = element.url;
        notifyObj.price = element.price.discountPrice - obj.currentPrice;
        notifyData.push(notifyObj);
      }
    }
  });
  return notifyData;
};

module.exports = util;
