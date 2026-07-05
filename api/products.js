import data from '../server/data.json';

export default function handler(req, res) {
  const orders = data.orders || [];

  const products = [
    ...new Map(
      orders
        .flatMap(order => order.items || [])
        .map(item => [item.id, item])
    ).values()
  ];

  res.status(200).json(products);
}