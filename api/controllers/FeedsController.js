const size = 10;
let pageNumber = 1;
let tweetsList = [];
let stream = '';

debugger
steemFeedsOnSearch = async (track) => {
  try {
    // const client = await sails.helpers.twitterClient.with();
    // if(stream){
    //   await stream.destroy();
    // }
    // stream = await client.stream('statuses/filter', { track });
    // stream.on('data', async function (event) {
    //   console.log({track});
    //   console.log({event});
    // event.notification: true;
    // event.read: false;
    //   const feed = await Feeds.findOne({searchInput: track});
      
    //   feed.items.unshift(event);
    //   await Feeds.update({ searchInput: track }, { items: feed.items });
    // });
    // stream.on('error', function(error) {
    //   console.log({ error });
    // });
    // return stream;
    setInterval(() => {
      console.log('********', Date.now())
      console.log('********')
      sails.sockets.blast('notificationSuccessEvent', { message: 'socket data' });
    }, 20000);
  } catch (error) {
    sails.sockets.blast('notificationErrorEvent', { error: error.message });
    throw new Error(error.message);
  }
};

searchFeed = async (req, res) => {
  const { searchInput = 'nodejs' } = req.query;
  const client = await sails.helpers.twitterClient.with();
  try {
    const params = { q: searchInput, count: 100 };
    resp = await Feeds.findOne({ searchInput });// remove this conditions
    tweetsList = resp.items;// remove this conditions
    if (!tweetsList.length) { // remove this conditions
      resp = await client.get('search/tweets', params);
      tweetsList = resp.statuses;
    } // remove this conditions
    const feed = await Feeds.findOne({ searchInput });
    if (!feed) {
      await Feeds.create({ searchInput, items: tweetsList });
    } else {
      await Feeds.update({searchInput}, { items: tweetsList });
    }
    await steemFeedsOnSearch(searchInput);
    const tweets = tweetsList.splice(0, size);
    return res.json(200, { tweets, page: 1, success: true });
  } catch (error) {
    return res.json(422, { error: error.message });
  }
}

feeds = async (req, res) => {
  const { page, searchInput = 'nodejs' } = req.query;
  pageNumber = Number(page);
  try {
    const resp = await Feeds.findOne({ searchInput });
    const tweets = resp.items.slice((size * (pageNumber - 1)), (size * pageNumber));
    const stream = await steemFeedsOnSearch(searchInput);
    return res.json(200, { tweets, page: pageNumber, success: true, searchInput });
  } catch (error) {
    return res.json(422, { error: error.message });
  }
};

module.exports = {
  feeds,
  searchFeed,
};

