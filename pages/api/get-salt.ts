import { NextApiHandler } from 'next';

/**
 * A dummy endpoint that returns user salts.
 *
 * WARNING: Do not use in production! This service ignores the JWT token
 * and always returns the same salt for every user.
 *
 * To learn more about user salt management, see:
 * https://docs.sui.io/build/zk_login#user-salt-management
 */
const handler: NextApiHandler = (req, res) => {
  if (req.method !== 'POST') {
    res.status(404);
    res.send({ message: 'Use a POST Request' });
  } else {
    res.status(200);
    // WARNING: we're ignoring the JWT token and always returning the same salt.
    res.send({ salt: '129390038577185583942388216820280642146' });
  }
};

export default handler;
