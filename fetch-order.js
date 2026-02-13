const orderId = process.argv[2] || '7033077039387';
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

console.log('\n🔍 Fetching Shopify Order:', orderId);
console.log('='.repeat(60), '\n');

const url = `https://${SHOPIFY_STORE}/admin/api/2024-01/orders/${orderId}.json`;

try {
  const response = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    console.error('❌ Error:', response.status, response.statusText);
    process.exit(1);
  }

  const data = await response.json();
  const order = data.order;

  console.log('✅ Order fetched:', order.name);
  console.log('Created:', order.created_at);
  console.log('Line Items:', order.line_items.length);
  console.log('\n' + '='.repeat(60));

  order.line_items.forEach((item, i) => {
    console.log(`\n📦 LINE ITEM ${i + 1}:`);
    console.log(`Title: ${item.title}`);
    console.log(`SKU: ${item.sku}`);

    if (item.properties && item.properties.length > 0) {
      console.log(`\n🏷️  Properties:`);
      item.properties.forEach((prop, j) => {
        console.log(`  [${j + 1}] ${prop.name} = "${prop.value}" (${typeof prop.value})`);
      });
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('\n📄 RAW PROPERTIES JSON:\n');
  console.log(JSON.stringify(order.line_items.map(item => ({
    title: item.title,
    properties: item.properties
  })), null, 2));

} catch (error) {
  console.error('❌ Error:', error.message);
}
