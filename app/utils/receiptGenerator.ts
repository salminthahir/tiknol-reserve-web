export type OrderItem = {
    id: string;
    name: string;
    price: number;
    qty: number;
};

export type Order = {
    id: string;
    customerName: string;
    totalAmount: number;
    items: OrderItem[];
    paymentType: string;
    createdAt: string;
};

export const generateRawBTUrl = (orderData: Order) => {
    const WIDTH = 32;
    const formatLine = (left: string, right: string) => {
        const space = WIDTH - left.length - right.length;
        return left + ' '.repeat(Math.max(0, space)) + right + '\n';
    };

    const centerLine = (text: string) => {
        const space = Math.max(0, Math.floor((WIDTH - text.length) / 2));
        return ' '.repeat(space) + text + '\n';
    };

    const separator = '-'.repeat(WIDTH) + '\n';

    const receiptDate = new Date(orderData.createdAt).toLocaleString('id-ID', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    let commands = '';

    commands += centerLine('TITIK NOL CAFE');
    commands += centerLine('Jl. Semangka No. 8, Palu');
    commands += centerLine('0812-3456-7890');
    commands += separator;

    commands += `NO: #${orderData.id.slice(-6).toUpperCase()}\n`;
    commands += `TGL: ${receiptDate}\n`;
    commands += `SVR: ${orderData.customerName.substring(0, 20)}\n`;
    commands += separator;

    const items = Array.isArray(orderData.items) ? orderData.items : [];

    if (items.length === 0) {
        commands += centerLine('(No Items)');
    } else {
        items.forEach(item => {
            commands += `${item.qty}x ${item.name.substring(0, 28)}\n`;
            commands += formatLine('', `Rp ${parseInt(String(item.price * item.qty)).toLocaleString('id-ID')}`);
        });
    }

    commands += separator;

    commands += formatLine('TOTAL', `Rp ${orderData.totalAmount.toLocaleString('id-ID')}`);
    commands += formatLine('PAYMENT', orderData.paymentType);

    commands += separator;
    commands += centerLine('TERIMA KASIH');
    commands += centerLine('Selamat Menikmati');
    commands += '\n\n\n';

    const base64Data = btoa(commands);
    return `intent:base64,${base64Data}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
};
