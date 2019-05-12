feeds = async (req, res) => {
  var params = { q: 'nodejs' };
  const client = await sails.helpers.twitterClient.with();
  client.get('statuses/home_timeline', params, function (error, tweets, response) {
    if (error) {
      return res.json(422, { error });
    }
    return res.json(200, { tweets, success: true });
  });
}

module.exports = {
  feeds,
};

