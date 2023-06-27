import { NextResponse } from 'next/server';

import prisma from '../../../../prisma/prisma.mjs';

const ORDER_STATUS_API = 'https://api2.ordinalsbot.com/order'
const UNPAID = 'unpaid';

export async function GET() {
  try {
    const unpaidOrders = await prisma.order.findMany({
      where: {
        status: UNPAID
      }
    });

    var updatedOrders = 0;
    for (const unpaidOrder of unpaidOrders) {
      const unpaidOrderStatusReq = await fetch(`${ORDER_STATUS_API}?id=${unpaidOrder.id}`);
      if (unpaidOrderStatusReq.status !== 200) {
        console.error(`Could not retrieve order status for order "${unpaidOrder.id}" (${unpaidOrderStatus.status}): ${unpaidOrderStatus.statusText}`);
      }
      const unpaidOrderStatus = await unpaidOrderStatusReq.json();
      const newOrderStatus = unpaidOrderStatus.charge.status;
      if (newOrderStatus !== UNPAID) {
        const updatedOrders = await prisma.order.update({
          where: { id: unpaidOrder.id },
          data: { status: unpaidOrderStatus.charge.status }
        });
        if (updatedOrders !== 1) {
          console.error(`Could not update order status for order "${unpaidOrder.id}"`);
        }
        updatedOrderStatus++;
        console.log(`Updated status of order "${unpaidOrder.id}" from "${UNPAID}" to "${newOrderStatus}"`);
      }
    }

    console.log(`Successfully updated ${updatedOrders} orders`);
    return NextResponse.json({updatedOrders: updatedOrders}, {status: 200, statusText: `Successfully updated ${updatedOrders} orders`});
  } catch (err) {
    console.error(err);
    return NextResponse.json(err, {status: 500, statusText: err});
  }
}
