import { NextApiHandler } from 'next';

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(404);
    res.send({ message: 'Use a Get Request' });
  } else {
    try {
      const response = await fetch(process.env.URL_ZK_PROVER || '', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();

      res.status(200);
      res.send(data);
    } catch (e) {
      console.warn(e);
    }
  }
};

export default handler;
