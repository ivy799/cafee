'use client'

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Order {
    id: number;
    userId: number;
    total: number;
    status: string;
    createdAt: string;
}

interface OrderItem {
    id: number;
    orderId: number;
    menuId: number;
    quantity: number;
    priceEach: number;
    menu?: {
        name: string;
        price: number;
        image?: string;
    };
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

const supabase = createClient(supabaseUrl, supabaseKey);


export default function Dashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            await Promise.all([fetchOrders(), fetchOrderItems()]);
        } catch (error) {
            console.error('Fetch error:', error);
            setError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };


    const fetchOrders = async () => {
        const { data, error } = await supabase
            .from('order') 
            .select('id, userId, total, status, createdAt')
            .order('createdAt', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch orders: ${error.message}`);
        }

        setOrders(data || []);
    }

    const fetchOrderItems = async () => {
        const { data, error } = await supabase
            .from('orderItems') 
            .select(`
                id, 
                orderId, 
                menuId, 
                quantity, 
                priceEach,
                menu!orderItems_menuId_fkey (
                    name,
                    price,
                    image
                )
            `);

        if (error) {
            console.warn('Join query failed, trying simple query:', error.message);

            const { data: simpleData, error: simpleError } = await supabase
                .from('orderItems')
                .select('id, orderId, menuId, quantity, priceEach');

            if (simpleError) {
                throw new Error(`Failed to fetch order items: ${simpleError.message}`);
            }

            const itemsWithMenu = await Promise.all(
                (simpleData || []).map(async (item) => {
                    const { data: menuData } = await supabase
                        .from('menu') 
                        .select('name, price, image')
                        .eq('id', item.menuId)
                        .single();

                    return {
                        ...item,
                        menu: menuData || undefined
                    };
                })
            );

            setOrderItems(itemsWithMenu);
            return;
        }

        setOrderItems(
            (data || []).map((item: any) => ({
                ...item,
                menu: Array.isArray(item.menu) ? item.menu[0] : item.menu
            }))
        );
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'success':
            case 'completed':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'failed':
            case 'cancelled':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const getOrderItems = (orderId: number) => {
        return orderItems.filter(item => item.orderId === orderId);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center">
                <div className="text-center text-red-600 dark:text-red-400">
                    <p className="text-xl font-semibold mb-2">Error Loading Dashboard</p>
                    <p className="mb-4">{error}</p>
                    <Button onClick={() => fetchData()} className="mt-4">
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-background py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                        Manage orders and track business performance
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Total Orders
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {orders.length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Total Revenue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                Rp. {orders.reduce((sum, order) => sum + order.total, 0).toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Pending Orders
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">
                                {orders.filter(order => order.status === 'pending').length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Completed Orders
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {orders.filter(order => order.status === 'success').length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {orders.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500 dark:text-gray-400">No orders found</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {orders.map((order) => {
                                    const items = getOrderItems(order.id);
                                    return (
                                        <div key={order.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        Order #{order.id}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {new Date(order.createdAt).toLocaleDateString()} at{' '}
                                                        {new Date(order.createdAt).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <Badge className={getStatusColor(order.status)}>
                                                        {order.status}
                                                    </Badge>
                                                    <div className="text-right">
                                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                            Rp. {order.total.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <h4 className="font-medium text-gray-900 dark:text-white">Items:</h4>
                                                {items.length === 0 ? (
                                                    <p className="text-gray-500 dark:text-gray-400 text-sm">No items found for this order</p>
                                                ) : (
                                                    items.map((item) => {
                                                        const menu = Array.isArray(item.menu) ? item.menu[0] : item.menu;
                                                        return (
                                                            <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                                                                <div className="flex items-center gap-3">
                                                                    {menu?.image && (
                                                                        <Image
                                                                            src={menu.image}
                                                                            alt={menu.name || 'Menu item'}
                                                                            width={40}
                                                                            height={40}
                                                                            className="rounded object-cover"
                                                                        />
                                                                    )}
                                                                    <div>
                                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                                            {menu?.name || `Menu ID: ${item.menuId}`}
                                                                        </p>
                                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                            Qty: {item.quantity} × Rp. {item.priceEach.toLocaleString()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <p className="font-medium text-gray-900 dark:text-white">
                                                                    Rp. {(item.quantity * item.priceEach).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


