
import type { ApiEndpoint } from './types';

export const initialEndpoints: ApiEndpoint[] = [
  {
    id: '1',
    httpMethod: 'GET',
    path: '/v1/users/{userId}',
    description: 'Retrieves user details from the legacy CRM database.',
    parameters: [
      { name: 'userId', type: 'integer', description: 'The unique identifier for the user.' }
    ],
    querySuggestion: "SELECT user_id, first_name, last_name, email, creation_date FROM legacy_users WHERE user_id = {userId};",
    status: 'active'
  },
  {
    id: '2',
    httpMethod: 'GET',
    path: '/v1/products',
    description: 'Fetches a list of all products from the inventory system.',
     parameters: [
      { name: 'limit', type: 'integer', description: 'Number of products to return.' },
      { name: 'offset', type: 'integer', description: 'Offset for pagination.' },
    ],
    querySuggestion: "SELECT product_id, product_name, price, stock_quantity FROM legacy_products LIMIT {limit} OFFSET {offset};",
    status: 'active'
  },
  {
    id: '3',
    httpMethod: 'POST',
    path: '/v1/orders',
    description: 'Creates a new order in the sales database.',
    parameters: [
      { name: 'productId', type: 'integer', description: 'The ID of the product being ordered.' },
      { name: 'quantity', type: 'integer', description: 'The number of units to order.' },
      { name: 'customerId', type: 'string', description: 'The ID of the customer placing the order.' }
    ],
    querySuggestion: "INSERT INTO legacy_orders (product_id, quantity, customer_id, order_date) VALUES ({productId}, {quantity}, {customerId}, NOW());",
    status: 'inactive'
  }
];
