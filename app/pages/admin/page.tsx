import React from 'react'
import AdminSellOrdersPage from '@/components/admin/sellOrders'
import AdminBuyOrdersPage from '@/components/admin/buyOrders'
export default function admin() {
    return (
        <div className="flex flex-col w-full h-full">
            <AdminSellOrdersPage />
            <AdminBuyOrdersPage />
        </div>

    )
}
