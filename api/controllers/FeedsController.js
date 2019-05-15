const size = 10;
let pageNumber = 1;
let tweetsList = [];
let stream = '';

steemFeedsOnSearch = async (track) => {
  try {
    const client = await sails.helpers.twitterClient.with();
    if (stream) {
      await stream.destroy();
    }
    stream = await client.stream('statuses/filter', { track });
    stream.on('data', async function (event) {
      console.log({ track });
      console.log({ event });
      const feed = await Feeds.findOne({ searchInput: track });
      feed.items.unshift(event);
      await Feeds.update({ searchInput: track }, { items: feed.items });
      event.notification = true;
      event.read = false;
      sails.sockets.blast('notificationSuccessEvent', event);
    });
    stream.on('error', function (error) {
      console.log({ error });
    });
    return stream;
  } catch (error) {
    sails.sockets.blast('notificationErrorEvent', { error: error.message });
    throw new Error(error.message);
  }
};

getTweetsFromRemote = async (searchInput) => {
  debugger
  const params = { q: searchInput, count: 100 };
  resp = await client.get('search/tweets', params);
   return resp.statuses;
}

searchFeed = async (req, res) => {
  const { searchInput = 'nodejs' } = req.query;
  const client = await sails.helpers.twitterClient.with();
  try {
    
    const feed = await Feeds.findOne({ searchInput });
    if (!feed) {
      await Feeds.create({ searchInput, items: tweetsList });
    } else {
      await Feeds.update({ searchInput }, { items: tweetsList });
    }
    await steemFeedsOnSearch(searchInput);
    const tweets = tweetsList.splice(0, size);
    return res.json(200, { tweets, page: 1, success: true });
  } catch (error) {
    return res.json(422, { error: error.message });
  }
}

feeds = async (req, res) => {
  let resp = {};
  const { page, searchInput = 'nodejs' } = req.query;
  pageNumber = Number(page);
  try {
    resp = await Feeds.findOne({ searchInput });
    if(!resp){
      resp.items = await getTweetsFromRemote(searchInput)
    }
    const tweets = (resp && resp.items) ? resp.items.slice((size * (pageNumber - 1)), (size * pageNumber)) : [];
    await steemFeedsOnSearch(searchInput);
    return res.json(200, { tweets, page: pageNumber, success: true, searchInput });
  } catch (error) {
    return res.json(422, { error: error.message });
  }
};

module.exports = {
  feeds,
  searchFeed,
};

