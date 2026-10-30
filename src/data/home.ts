export type Category = 'Beauty' | 'Electronics' | 'Fashion' | 'Home & Living' | 'Groceries' | 'Gadgets';
export interface Product {
    id: number;
    name: string;
    price: number;
    originalPrice: number;
    category: Category;
}
export const categories: Category[] = ['Beauty', 'Electronics', 'Fashion', 'Home & Living', 'Groceries', 'Gadgets'];
const items: [
    string,
    number,
    Category
][] = [
    ['Asus Zenbook A14 Slim Laptop', 1233700, 'Electronics'], ['Anker Soundcore Q30 Wireless Headphones, ANC Multiple Modes, 40h Playtime', 84499, 'Electronics'], ['NewGen 2.5kva Solar Generator', 890000, 'Electronics'], ['Cerave Foaming Cleanser For Normal To Oily Skin 236ml', 17175, 'Beauty'], ['Hisense 50” Smart TV 50a4q', 415000, 'Electronics'], ['Nivea Express Hydration Body Lotion For Women – 400ml – Pack Of 2', 7395, 'Beauty'], ['LDNIO Super Fast Charger With 2 USB Ports & 2 Type-C Ports – 65W', 39000, 'Gadgets'], ['Nivea Nourishing Cocoa Body Lotion For Women – 400ml', 3915, 'Beauty'], ['Asus Vivobook OLED Core i7 Laptop', 926200, 'Electronics'], ['Vention Portable Wireless Mouse', 18250, 'Gadgets'], ['Asus Zenbook Duo Touch Screen Intel Core Ultra 9 Laptop', 2622000, 'Electronics'], ['Exclusive Foam Furniture Jumbo 3 Seater Sofa – Black', 599000, 'Home & Living'], ['Asus ROG Strix Gaming Laptop – Intel Core i9', 1548600, 'Electronics'], ['Nivea Men Deep Extreme Antiperspirant Roll-on – 50ml', 1800, 'Beauty'], ['Trendy alloy earrings set – Gold', 3875, 'Fashion'], ['Wine Red Wig With Closure – Long Body Wave', 25000, 'Fashion'], ['Curly Black Brown Long Wig – Body Wave', 9983, 'Fashion'], ['Knorr Beef Seasoning Cubes 400g', 1380, 'Groceries'], ['Andrew’s Herbal Malt Tonic – Pack of 6', 300580, 'Groceries'], ['WAW Liquid Detergent 1 Litre', 3470, 'Home & Living'], ['SALUB Short Sleeve T-shirt + Shorts – White', 8010, 'Fashion'], ['Binatone 1.8 Litres Fast Heating Electric Kettle', 17066, 'Home & Living'], ['Double Burner Electric Table Top Hot Plate', 17403, 'Home & Living'], ['Skyrun 200L Chest Freezer', 295750, 'Electronics'], ['Nexus 80 Litres Single Door Refrigerator – Silver', 163750, 'Electronics'], ['Martell Aged Brandy 70cl', 9000, 'Groceries']
];
export const products: Product[] = items.map(([name, price, category], id) => ({ id, name, price, category, originalPrice: Math.round(price / (1 - [18, 5, 10, 5, 20, 10, 10, 5][id % 8] / 100)) }));
export const formatPrice = (price: number) => `₦${price.toLocaleString('en-NG')}`;
