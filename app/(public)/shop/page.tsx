"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, X, Plus, Minus, ArrowLeft, Search, Star, ArrowRight, Check, Sparkles, Filter } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

// --- DATA TYPE DEFINITIONS ---
type Product = {
  id: string;
  name: string;
  price: number;
  category: 'BAJU/KAOS' | 'TOPI' | 'TUMBLR' | 'TOTEBAG' | 'ACCESSORIES' | 'BREWING GEAR';
  description: string;
  image: string;
  sizes?: string[];
};

type CartItem = Product & {
  qty: number;
  selectedSize?: string;
  uniqueKey: string;
};

// --- LARGE DEMO MERCHANDISE PRODUCTS ---
const MERCH_PRODUCTS: Product[] = [
  // === CATEGORY: BAJU/KAOS (10 items) ===
  {
    id: 'tee-01',
    name: 'NOL OVERSIZED GOLD LOGO TEE',
    price: 185000,
    category: 'BAJU/KAOS',
    description: 'Premium heavyweight 24s organic cotton with a modern streetwear silhouette. Features the signature .NOL minimal brand mark embroidered with premium luxury gold yarn on the chest.',
    image: '/merch/tee.png',
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 'tee-02',
    name: 'ESTABLISHED 2020 BLACK TEE',
    price: 175000,
    category: 'BAJU/KAOS',
    description: 'Classic fit premium combed cotton featuring a vintage high-density screenprinted brand statement on the back and established year detail.',
    image: '/merch/tee.png',
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 'tee-03',
    name: 'BREW CULTURE HEAVYWEIGHT TEE',
    price: 195000,
    category: 'BAJU/KAOS',
    description: 'Ultra-thick 300gsm cotton t-shirt with a boxy fit. Features a beautiful minimalist typography print reflecting contemporary coffee house culture.',
    image: '/merch/tee.png',
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 'tee-04',
    name: 'THE LAST DROP SIGNATURE TEE',
    price: 180000,
    category: 'BAJU/KAOS',
    description: 'A comfortable essential tee with premium flat seam stitching. Features subtle front chest embroidery and "The Last Drop" brand print on the lower hem.',
    image: '/merch/tee.png',
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 'tee-05',
    name: 'TITIK NOL RESERVE ACID WASH TEE',
    price: 220000,
    category: 'BAJU/KAOS',
    description: 'Individually dyed premium heavyweight tee for a unique distressed look. Features vintage crack-ink typography print for rugged luxury streetwear vibe.',
    image: '/merch/tee.png',
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 'tee-06',
    name: 'MINIMALIST LOGO WHITE TEE',
    price: 175000,
    category: 'BAJU/KAOS',
    description: 'Crisp, ultra-white premium combed cotton with a clean minimal brand logo printed in high-density gold silicone ink at the center.',
    image: '/merch/tee.png',
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 'tee-07',
    name: 'BARISTA CHAMPIONS CLUB SHIRT',
    price: 185000,
    category: 'BAJU/KAOS',
    description: 'Sleek dark apparel celebrating the dedication and craftsmanship of reserve coffee masters. Graphic crest print at the back with signature lettering.',
    image: '/merch/tee.png',
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 'tee-08',
    name: 'NOL ESSENTIALS POCKET TEE',
    price: 190000,
    category: 'BAJU/KAOS',
    description: 'Heavy cotton tee with an utility front pocket. Finished with woven label detailing and discrete gold brand stitching on the sleeve cuff.',
    image: '/merch/tee.png',
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 'tee-09',
    name: 'COFFEE IS ART GRAPHIC TEE',
    price: 180000,
    category: 'BAJU/KAOS',
    description: 'Artistic blueprint illustration of espresso anatomy and brewing science screenprinted on ultra-soft luxury combed cotton.',
    image: '/merch/tee.png',
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 'tee-10',
    name: 'RESERVE EDITION BOX LOGO TEE',
    price: 200000,
    category: 'BAJU/KAOS',
    description: 'Limited edition streetwear box logo tee featuring premium gold embroidery outline and ultra-soft premium brush finish.',
    image: '/merch/tee.png',
    sizes: ['S', 'M', 'L', 'XL']
  },

  // === CATEGORY: TOPI (10 items) ===
  {
    id: 'hat-01',
    name: 'RESERVE VINTAGE TRUCKER CAP',
    price: 125000,
    category: 'TOPI',
    description: 'Distressed raw wash cotton canvas trucker hat with robust breathable polyester mesh, an adjustable strap, and a beautifully stitched vintage gold emblem.',
    image: '/merch/hat.png'
  },
  {
    id: 'hat-02',
    name: 'NOL SIGNATURE DAD HAT',
    price: 115000,
    category: 'TOPI',
    description: 'Unstructured 100% cotton twill dad hat featuring classic curved brim, slide buckle closure, and elegant minimal front gold embroidery.',
    image: '/merch/hat.png'
  },
  {
    id: 'hat-03',
    name: 'TITIK NOL BEANIE KNIT',
    price: 95000,
    category: 'TOPI',
    description: 'Soft double-layered acrylic knit beanie. Featuring a fold-over cuff and an elegant black and gold woven brand label.',
    image: '/merch/hat.png'
  },
  {
    id: 'hat-04',
    name: 'BREW CULTURE FLAT BRIM CAP',
    price: 135000,
    category: 'TOPI',
    description: 'Structured 6-panel street cap with a modern flat brim. Featuring premium raised embroidery lettering and high-density sweatband.',
    image: '/merch/hat.png'
  },
  {
    id: 'hat-05',
    name: 'THE LAST DROP CAMP CAP',
    price: 130000,
    category: 'TOPI',
    description: 'Low-profile 5-panel camper style hat built from heavy cotton duck canvas. Includes quick-release nylon strap closure and subtle branding.',
    image: '/merch/hat.png'
  },
  {
    id: 'hat-06',
    name: 'ESTABLISHED 2020 CORDUROY CAP',
    price: 140000,
    category: 'TOPI',
    description: 'Retro 8-wale premium corduroy structure cap in deep slate. Embroidered established year crest in brilliant gold contrast stitching.',
    image: '/merch/hat.png'
  },
  {
    id: 'hat-07',
    name: 'BARISTA TRUCKER EDITION',
    price: 125000,
    category: 'TOPI',
    description: 'Special edition breathable mesh trucker cap designed for baristas. Featuring front water-repellent panel and luxury details.',
    image: '/merch/hat.png'
  },
  {
    id: 'hat-08',
    name: 'RESERVE CLASSIC BASEBALL HAT',
    price: 120000,
    category: 'TOPI',
    description: 'Sleek unstructured cotton cap with a pre-curved visor, perfect for daily wear. Styled with minimal side-placed monogram logo.',
    image: '/merch/hat.png'
  },
  {
    id: 'hat-09',
    name: 'NOL MINIMALIST BUCKET HAT',
    price: 130000,
    category: 'TOPI',
    description: 'Classic streetwear bucket profile in heavy cotton fabric. Features a 360-degree brim and a discreet embroidered branding label.',
    image: '/merch/hat.png'
  },
  {
    id: 'hat-10',
    name: 'STREETWEAR LOGO BEANIE',
    price: 95000,
    category: 'TOPI',
    description: 'A cozy streetwear winter staple beanie. Made with premium ultra-soft spun acrylic featuring minimal brand patch styling.',
    image: '/merch/hat.png'
  },

  // === CATEGORY: TUMBLR (10 items) ===
  {
    id: 'tumbler-01',
    name: 'THERMAL INSULATED FLASK 0.0',
    price: 245000,
    category: 'TUMBLR',
    description: 'Double-walled food-grade stainless steel thermal flask in sleek matte black. Vacuum insulation keeps beverages ice-cold for 24 hours or hot for 12 hours.',
    image: '/merch/tumbler.png'
  },
  {
    id: 'tumbler-02',
    name: 'RESERVE TRAVEL MUG SLATE',
    price: 195000,
    category: 'TUMBLR',
    description: 'Compact leak-proof commuter mug with a secure lock lid. Coated in elegant scratch-resistant powder-coated matte finish.',
    image: '/merch/tumbler.png'
  },
  {
    id: 'tumbler-03',
    name: 'NOL STAINLESS COLD TUMBLER',
    price: 225000,
    category: 'TUMBLR',
    description: 'Generously sized stainless steel tumbler with reusable straw. Perfect for keeping iced espresso or cold brew frosty all day.',
    image: '/merch/tumbler.png'
  },
  {
    id: 'tumbler-04',
    name: 'BREW CULTURE GLASSMUG SINGLE',
    price: 115000,
    category: 'TUMBLR',
    description: 'High-temperature resistant borosilicate single-wall glass mug. Styled with subtle white typography print detailing.',
    image: '/merch/tumbler.png'
  },
  {
    id: 'tumbler-05',
    name: 'THE LAST DROP CERAMIC CUP',
    price: 90000,
    category: 'TUMBLR',
    description: 'Heavyweight hand-fired ceramic espresso cup with a tactile raw clay base and elegant semi-matte dark glaze finish.',
    image: '/merch/tumbler.png'
  },
  {
    id: 'tumbler-06',
    name: 'TITIK NOL MATTE SILICON BOTTLE',
    price: 165000,
    category: 'TUMBLR',
    description: 'Collapsible ultra-light food-grade silicone flask. Space-saving, highly durable, and styled with premium minimal branding.',
    image: '/merch/tumbler.png'
  },
  {
    id: 'tumbler-07',
    name: 'DOUBLE-WALL COFFEE INFUSER',
    price: 275000,
    category: 'TUMBLR',
    description: 'Ultra-premium double-wall glass travel infuser flask with build-in steel filter. Brew loose leaf or filter coffee on the go.',
    image: '/merch/tumbler.png'
  },
  {
    id: 'tumbler-08',
    name: 'ESPRESSO SHOT GLASS DUO',
    price: 85000,
    category: 'TUMBLR',
    description: 'Set of two heat-resistant graduated borosilicate shot glasses, perfect for precision home espresso extraction.',
    image: '/merch/tumbler.png'
  },
  {
    id: 'tumbler-09',
    name: 'COLD BREW PORTABLE BOTTLE',
    price: 210000,
    category: 'TUMBLR',
    description: 'Minimalist extraction flask with an integrated fine stainless steel mesh filter core. Add coffee ground, steep in fridge, pour and enjoy.',
    image: '/merch/tumbler.png'
  },
  {
    id: 'tumbler-10',
    name: 'RESERVE LABEL COMMUTER MUG',
    price: 235000,
    category: 'TUMBLR',
    description: 'Double-walled insulated standard commuter companion mug featuring direct-pour mesh interior and elegant gold-plated steel accent ring.',
    image: '/merch/tumbler.png'
  },

  // === CATEGORY: TOTEBAG (10 items) ===
  {
    id: 'tote-01',
    name: 'ORGANIC HEAVY CANVAS TOTE',
    price: 95000,
    category: 'TOTEBAG',
    description: 'Durable heavyweight organic cotton canvas tote in natural beige with robust contrast black shoulder straps. Features an inner key-pocket.',
    image: '/merch/totebag.png'
  },
  {
    id: 'tote-02',
    name: 'BREW CULTURE DENIM TOTE',
    price: 115000,
    category: 'TOTEBAG',
    description: 'Heavy raw indigo denim tote bag. Built to age beautifully, with heavy duty nylon stitched handles and premium inner pocket detailing.',
    image: '/merch/totebag.png'
  },
  {
    id: 'tote-03',
    name: 'NOL UTILITY MESSENGER BAG',
    price: 145000,
    category: 'TOTEBAG',
    description: 'Crossbody courier-style canvas bag featuring thick adjustable strap, secure brass snap closure, and interior pocket organization.',
    image: '/merch/totebag.png'
  },
  {
    id: 'tote-04',
    name: 'THE LAST DROP CORDUROY SLING',
    price: 125000,
    category: 'TOTEBAG',
    description: 'Soft 12-wale corduroy crossbody sling with a wide shoulder strap. Highly tactile, lightweight, and perfect for carrying books and devices.',
    image: '/merch/totebag.png'
  },
  {
    id: 'tote-05',
    name: 'TITIK NOL BARISTA ROLL-UP BAG',
    price: 265000,
    category: 'TOTEBAG',
    description: 'Premium heavy canvas utility roll-up organizer designed for pro baristas. Store tampers, scales, drippers, and brushes securely.',
    image: '/merch/totebag.png'
  },
  {
    id: 'tote-06',
    name: 'ESTABLISHED 2020 BACKPACK LIGHT',
    price: 195000,
    category: 'TOTEBAG',
    description: 'Minimalist water-repellent nylon backpack. Includes dedicated laptop sleeve, breathable straps, and high-density screenprinted brand tag.',
    image: '/merch/totebag.png'
  },
  {
    id: 'tote-07',
    name: 'RESERVE LABEL DRAWSTRING BAG',
    price: 75000,
    category: 'TOTEBAG',
    description: 'Premium thick cotton drawstring cinch sack with durable climbing rope straps and high-contrast screenprinted gold insignia.',
    image: '/merch/totebag.png'
  },
  {
    id: 'tote-08',
    name: 'ECO-FRIENDLY SHOPPING TOTE',
    price: 45000,
    category: 'TOTEBAG',
    description: 'Foldable ultra-lightweight mesh shopper tote. Highly breathable, compact, and spacious, featuring thick comfortable webbed handles.',
    image: '/merch/totebag.png'
  },
  {
    id: 'tote-09',
    name: 'NOL MINIMAL CANVAS MINI BAG',
    price: 85000,
    category: 'TOTEBAG',
    description: 'A compact hand tote bag in natural canvas. Ideal size for personal daily items, keychains, and cosmetics.',
    image: '/merch/totebag.png'
  },
  {
    id: 'tote-10',
    name: 'STREETWEAR TOTE BLACK EDITION',
    price: 105000,
    category: 'TOTEBAG',
    description: 'Jet-black heavy organic cotton canvas tote featuring high-density typography printed in deep matte rubberized finish.',
    image: '/merch/totebag.png'
  },

  // === CATEGORY: ACCESSORIES (10 items) ===
  {
    id: 'acc-01',
    name: 'NOL ENAMEL BRAND PIN',
    price: 35000,
    category: 'ACCESSORIES',
    description: 'High-quality hard enamel pin featuring a minimalist coffee bean design outline in high-polished gold finish and rubber clutch backing.',
    image: '/merch/totebag.png'
  },
  {
    id: 'acc-02',
    name: 'RESERVE LEATHER KEYCHAIN',
    price: 45000,
    category: 'ACCESSORIES',
    description: 'Genuine full-grain cowhide leather strap keychain debossed with custom .NOL logo. Finished with solid matte black key ring.',
    image: '/merch/totebag.png'
  },
  {
    id: 'acc-03',
    name: 'BREW CULTURE STICKER PACK',
    price: 25000,
    category: 'ACCESSORIES',
    description: 'Set of 6 premium die-cut weatherproof vinyl stickers featuring reserve-themed brand logos, illustrations, and typography.',
    image: '/merch/totebag.png'
  },
  {
    id: 'acc-04',
    name: 'THE LAST DROP BARISTA APRON',
    price: 165000,
    category: 'ACCESSORIES',
    description: 'Commercial-grade thick cotton canvas apron with adjustable leather neck strap, custom front division pockets, and metal hardware accents.',
    image: '/merch/totebag.png'
  },
  {
    id: 'acc-05',
    name: 'ESTABLISHED 2020 LANYARD',
    price: 30000,
    category: 'ACCESSORIES',
    description: 'Premium double-sided polyester ribbon lanyard with lobster claw clip. Styled with recurring minimal brand monogram print.',
    image: '/merch/totebag.png'
  },
  {
    id: 'acc-06',
    name: 'TITIK NOL COFFEE JOURNAL',
    price: 65000,
    category: 'ACCESSORIES',
    description: 'Tactile textured dark cover journal with 80 pages of grid sheets, specifically formatted for recording extraction recipes and tasting logs.',
    image: '/merch/totebag.png'
  },
  {
    id: 'acc-07',
    name: 'RESERVE BRAND EMBROIDERED PATCH',
    price: 25000,
    category: 'ACCESSORIES',
    description: 'Fully embroidered iron-on brand patch. Made with highly detailed gold thread embroidery, ideal for customizing backpacks, aprons, and jackets.',
    image: '/merch/totebag.png'
  },
  {
    id: 'acc-08',
    name: 'NOL PREMIUM COASTER DUO',
    price: 55000,
    category: 'ACCESSORIES',
    description: 'Set of two natural absorbent cork and wood coasters with minimal brand screenprint. Keeps hot glasses and mugs stylishly insulated.',
    image: '/merch/totebag.png'
  },
  {
    id: 'acc-09',
    name: 'COFFEE IS LIFE PHONE CASE',
    price: 85000,
    category: 'ACCESSORIES',
    description: 'Ultra-thin drop-resistant TPU protective smartphone bumper case. Features high-quality matte graphic print at the back.',
    image: '/merch/totebag.png'
  },
  {
    id: 'acc-10',
    name: 'BARISTA ESSENTIALS HEADBAND',
    price: 40000,
    category: 'ACCESSORIES',
    description: 'Breathable, sweat-wicking elastic headband with subtle embroidered label. Perfect for active shifts behind the espresso machine.',
    image: '/merch/totebag.png'
  },

  // === CATEGORY: BREWING GEAR (10 items) ===
  {
    id: 'gear-01',
    name: 'NOL PRECISION HAND GRINDER',
    price: 585000,
    category: 'BREWING GEAR',
    description: 'Pro-grade manual coffee grinder with high-hardness stainless steel pentagonal burs, dual bearing alignment, and stepless click adjustments.',
    image: '/merch/tumbler.png'
  },
  {
    id: 'gear-02',
    name: 'RESERVE GOOSENECK KETTLE',
    price: 425000,
    category: 'BREWING GEAR',
    description: 'Sleek matte-black stainless steel gooseneck pour-over kettle. Features built-in analogue thermometer, flow-control spout, and ergonomic handle.',
    image: '/merch/tumbler.png'
  },
  {
    id: 'gear-03',
    name: 'BREW CULTURE V60 GLASS DRIpper',
    price: 165000,
    category: 'BREWING GEAR',
    description: 'Elegant heat-resistant glass V60 coffee dripper with robust natural olive wood base ring support. High extraction consistency.',
    image: '/merch/tumbler.png'
  },
  {
    id: 'gear-04',
    name: 'TITIK NOL PAPER FILTERS (100P)',
    price: 65000,
    category: 'BREWING GEAR',
    description: 'Premium oxygen-bleached organic wood pulp cone filters. Clean taste extraction, zero paper flavor transfer, pack of 100.',
    image: '/merch/tumbler.png'
  },
  {
    id: 'gear-05',
    name: 'THE LAST DROP ESPRESSO TAMPER',
    price: 195000,
    category: 'BREWING GEAR',
    description: 'Precision calibrated 58.5mm espresso hand tamper with ergonomic walnut wooden handle and heavy flat base.',
    image: '/merch/tumbler.png'
  },
  {
    id: 'gear-06',
    name: 'NOL SCALE WITH DIGITAL TIMER',
    price: 325000,
    category: 'BREWING GEAR',
    description: 'Water-resistant digital coffee scale with 0.1g accuracy, embedded timer, auto-start drip mode, and clear backlit high-visibility screen.',
    image: '/merch/tumbler.png'
  },
  {
    id: 'gear-07',
    name: 'BARISTA MILK FROTHING PITCHER',
    price: 145000,
    category: 'BREWING GEAR',
    description: 'High-grade stainless steel milk steam pitcher with custom sharp spout design optimized for fluid latte art pours.',
    image: '/merch/tumbler.png'
  },
  {
    id: 'gear-08',
    name: 'RESERVE COLD BREW DRIP TOWER',
    price: 1250000,
    category: 'BREWING GEAR',
    description: 'Exceptional visual drip tower with brass fittings, borosilicate glass spirals, and custom micro-adjustable water valve control.',
    image: '/merch/tumbler.png'
  },
  {
    id: 'gear-09',
    name: 'FRENCH PRESS RESERVE EDITION',
    price: 245000,
    category: 'BREWING GEAR',
    description: 'Double-walled glass and metal french press brewer with premium high-density filter screen for rich sediment-free extractions.',
    image: '/merch/tumbler.png'
  },
  {
    id: 'gear-10',
    name: 'COFFEE BEAN VACUUM CANISTER',
    price: 185000,
    category: 'BREWING GEAR',
    description: 'Air-tight stainless steel storage canister with built-in one-way CO2 de-gasser valve to keep roasted coffee beans at peak freshness.',
    image: '/merch/tumbler.png'
  }
];

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'BAJU/KAOS' | 'TOPI' | 'TUMBLR' | 'TOTEBAG' | 'ACCESSORIES' | 'BREWING GEAR'>('ALL');
  const [customerName, setCustomerName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Detail Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('M');

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('nol_merch_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save cart to localStorage
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('nol_merch_cart', JSON.stringify(newCart));
  };

  // --- CART LOGIC ---
  const handleAddToCart = (product: Product) => {
    if (product.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
      setSelectedProduct(product);
    } else {
      const uniqueKey = `${product.id}-standard`;
      const existing = cart.find(item => item.uniqueKey === uniqueKey);
      
      let newCart;
      if (existing) {
        newCart = cart.map(item => item.uniqueKey === uniqueKey ? { ...item, qty: item.qty + 1 } : item);
      } else {
        newCart = [...cart, { ...product, qty: 1, uniqueKey }];
      }
      saveCart(newCart);
    }
  };

  const confirmAddToCart = () => {
    if (!selectedProduct) return;
    
    const uniqueKey = `${selectedProduct.id}-${selectedSize}`;
    const existing = cart.find(item => item.uniqueKey === uniqueKey);

    let newCart;
    if (existing) {
      newCart = cart.map(item => item.uniqueKey === uniqueKey ? { ...item, qty: item.qty + 1 } : item);
    } else {
      newCart = [...cart, { ...selectedProduct, qty: 1, selectedSize, uniqueKey }];
    }
    saveCart(newCart);
    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const updateQty = (uniqueKey: string, delta: number) => {
    const newCart = cart.map(item => 
      item.uniqueKey === uniqueKey ? { ...item, qty: item.qty + delta } : item
    ).filter(item => item.qty > 0);
    saveCart(newCart);
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const isFormValid = cart.length > 0 && customerName.trim().length > 2 && whatsapp.trim().length > 8;

  // --- FILTER LOGIC ---
  const filteredProducts = MERCH_PRODUCTS.filter(p => {
    const matchesCategory = activeCategory === 'ALL' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.category.toLowerCase().includes(search.toLowerCase()) || 
                          p.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // --- WHATSAPP ORDER LOGIC ---
  const handleCheckout = () => {
    if (!isFormValid) return;

    // Standard WA number from footer
    const targetWA = "6282195383783"; 
    
    let message = `*NEW MERCHANDISE ORDER - .NOL RESERVE*\n`;
    message += `==============================\n\n`;
    message += `*Nama Pemesan:* ${customerName}\n`;
    message += `*Nomor WhatsApp:* ${whatsapp}\n\n`;
    message += `*Daftar Pesanan:*\n`;

    cart.forEach((item, index) => {
      message += `${index + 1}. *${item.name}*`;
      if (item.selectedSize) {
        message += ` (Size: ${item.selectedSize})`;
      }
      message += `\n   Qty: ${item.qty}x | Price: Rp ${(item.price * item.qty).toLocaleString()}\n\n`;
    });

    message += `==============================\n`;
    message += `*Total Pembayaran: Rp ${totalAmount.toLocaleString()}*\n\n`;
    message += `_Mohon info instruksi pembayaran & pengiriman merchandise._`;

    const encodedText = encodeURIComponent(message);
    const waUrl = `https://wa.me/${targetWA}?text=${encodedText}`;
    
    // Clear cart and close drawer upon checkout
    saveCart([]);
    setIsCartOpen(false);
    
    window.open(waUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#e0e0e0] font-sans selection:bg-[#FBC02D] selection:text-black transition-colors duration-500">
      <style jsx global>{`* { -webkit-tap-highlight-color: transparent; }`}</style>

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-40 h-20 px-4 md:px-8 flex items-center justify-between bg-[#080808]/80 backdrop-blur-md border-b border-white/5 transition-colors duration-500">
        <Link href="/" className="flex items-center gap-2 group active:scale-95 transition-transform duration-200">
          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg group-hover:border-[#FBC02D]/50 group-hover:bg-white/10 transition-all duration-500 transform group-hover:-translate-y-0.5">
            <h1 className="text-base font-black tracking-tighter text-white"><span className="text-[#FBC02D]">.</span>NOL</h1>
          </div>
          <span className="hidden md:inline font-light text-lg tracking-wider uppercase text-neutral-400 group-hover:text-white transition-colors duration-500">Reserve Label</span>
        </Link>

        {/* Navigation Items */}
        <div className="flex items-center gap-6">
          <Link href="/menu" className="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-colors">
            Order Coffee
          </Link>
          <Link href="/" className="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-colors">
            Home
          </Link>
        </div>

        <button onClick={() => setIsCartOpen(true)} className="flex relative items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-all active:scale-95 text-white">
          <span className="text-xs font-bold uppercase hidden sm:inline">Bag</span>
          <ShoppingBag size={18} className="text-[#FBC02D]" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FBC02D] text-black text-[9px] font-black flex items-center justify-center rounded-full">
              {totalItems}
            </span>
          )}
        </button>
      </nav>

      {/* HERO & TITLE SECTION */}
      <section className="pt-32 pb-16 px-4 text-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1a1a] via-[#080808] to-[#080808]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FBC02D]/30 bg-[#FBC02D]/5 text-[#FBC02D] text-[10px] font-mono tracking-widest uppercase mb-4 animate-pulse">
          <Star size={10} fill="currentColor" /> Official Merchandise Label
        </div>
        <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-4 leading-none text-white">
          THE RESERVE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FBC02D] to-yellow-600">LABEL</span>
        </h1>
        <p className="max-w-md mx-auto text-neutral-400 text-xs md:text-sm font-light tracking-wide">
          Elevate your daily coffee ritual with our massive streetwear apparel, lifestyle goods, and professional brewing gears.
        </p>
      </section>

      {/* MARQUEE */}
      <div className="bg-[#FBC02D] text-black overflow-hidden py-2.5 relative border-y border-black/10">
        <div className="flex gap-8 animate-marquee whitespace-nowrap font-black text-xs uppercase tracking-widest w-max">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="flex items-center gap-2">
              Limited Drop • Premium Wearables • Custom Stitching • High-Quality Organic Cotton • <Sparkles size={14} />
            </span>
          ))}
        </div>
      </div>

      {/* FILTER & PRODUCT DISPLAY */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        
        {/* Category Controls & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5 mb-10">
          
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide w-full md:w-auto">
            {(['ALL', 'BAJU/KAOS', 'TOPI', 'TUMBLR', 'TOTEBAG', 'ACCESSORIES', 'BREWING GEAR'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-[9px] font-extrabold uppercase tracking-widest border transition-all duration-300 ${
                  activeCategory === cat 
                    ? 'bg-[#FBC02D] text-black border-[#FBC02D] shadow-lg shadow-[#FBC02D]/10' 
                    : 'bg-transparent text-neutral-400 border-white/10 hover:border-white/30 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
            <input
              type="text"
              placeholder="SEARCH LABEL..."
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 text-xs focus:border-[#FBC02D] focus:outline-none transition-all text-white placeholder-neutral-600 uppercase font-bold tracking-wider"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Dynamic Category Summary */}
        <div className="flex items-center gap-2 mb-6 font-mono text-[10px] uppercase tracking-widest text-[#FBC02D]">
          <Star size={10} fill="currentColor" />
          <span>Showing {filteredProducts.length} items in {activeCategory}</span>
        </div>

        {/* PRODUCTS GRID */}
        {filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-neutral-500 border border-dashed border-white/10 rounded-3xl">
            <ShoppingBag className="w-12 h-12 mb-4 opacity-30" />
            <p className="font-mono text-xs uppercase tracking-widest">No label goods found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                onClick={() => handleAddToCart(product)}
                className="group relative bg-[#111] border border-white/5 rounded-2xl overflow-hidden hover:border-[#FBC02D]/30 transition-all duration-500 cursor-pointer flex flex-col justify-between"
              >
                {/* Image panel */}
                <div className="relative aspect-square overflow-hidden bg-neutral-900">
                  <Image 
                    src={product.image} 
                    alt={product.name} 
                    fill 
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100" 
                  />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-[#FBC02D] text-[8px] font-black font-mono px-2.5 py-1 rounded-md border border-white/5 uppercase tracking-wider">
                    {product.category}
                  </div>
                  
                  {/* Subtle Add Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="bg-white text-black px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      {product.sizes ? 'CHOOSE SIZE' : 'ADD TO BAG'}
                    </span>
                  </div>
                </div>

                {/* Details Panel */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="font-black text-sm text-white line-clamp-1 group-hover:text-[#FBC02D] transition-colors uppercase tracking-tight">
                      {product.name}
                    </h3>
                    <p className="text-neutral-400 text-xs line-clamp-2 leading-relaxed font-light">
                      {product.description}
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-5 pt-3 border-t border-white/5">
                    <p className="font-mono font-black text-base text-[#FBC02D]">
                      Rp {product.price.toLocaleString()}
                    </p>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#FBC02D] group-hover:text-black transition-all">
                      <Plus size={16} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- SIZE CUSTOMIZATION MODAL (BAJU) --- */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedProduct(null)} />
          <div className="relative w-full max-w-md bg-[#111] border-t md:border border-white/10 rounded-t-3xl md:rounded-2xl overflow-hidden shadow-2xl animate-slide-up">
            <div className="p-6 space-y-6">
              
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[#FBC02D] font-mono text-[9px] font-black uppercase tracking-widest">SELECT FIT SIZE</span>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white">{selectedProduct.name}</h2>
                  <p className="text-neutral-400 font-mono font-bold text-sm">Rp {selectedProduct.price.toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => setSelectedProduct(null)} 
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Sizes Selection */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Available Sizes</p>
                <div className="grid grid-cols-4 gap-2">
                  {selectedProduct.sizes?.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-3.5 rounded-xl border-2 font-black transition-all flex flex-col items-center justify-center ${
                        selectedSize === size
                          ? 'bg-[#FBC02D] text-black border-[#FBC02D] shadow-[0_8px_16px_rgba(251,192,45,0.15)] translate-y-[-2px]'
                          : 'bg-white/5 border-white/5 text-neutral-400 hover:border-white/15'
                      }`}
                    >
                      <span className="text-xs">{size}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={confirmAddToCart} 
                className="w-full bg-[#FBC02D] text-black py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-yellow-500 transition-all active:scale-95 shadow-xl shadow-[#FBC02D]/10"
              >
                Add to Bag <Plus size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SHOPPING BAG DRAWER --- */}
      {isCartOpen && <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[50]" onClick={() => setIsCartOpen(false)} />}
      <div className={`fixed top-0 right-0 h-full w-[90vw] sm:w-[450px] z-[60] bg-[#080808] border-l border-white/10 shadow-2xl flex flex-col transition-transform duration-500 ease-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Drawer Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 bg-white/5">
          <h2 className="font-black text-lg uppercase tracking-widest flex items-center gap-2 text-white">
            Label<span className="text-[#FBC02D]">Bag</span>
          </h2>
          <button 
            onClick={() => setIsCartOpen(false)} 
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-4 opacity-50">
              <ShoppingBag size={48} className="text-[#FBC02D]" />
              <p className="font-mono text-[9px] uppercase tracking-[0.2em]">Bag is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.uniqueKey} className="group relative bg-white/5 border border-white/5 p-4 rounded-2xl transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-1 pr-4">
                    <h4 className="font-black text-xs text-white uppercase line-clamp-1">{item.name}</h4>
                    {item.selectedSize && (
                      <span className="inline-block text-[8px] font-black bg-white/10 px-2 py-0.5 rounded text-[#FBC02D]">
                        SIZE: {item.selectedSize}
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-[#FBC02D] font-bold">
                    Rp {(item.price * item.qty).toLocaleString()}
                  </p>
                </div>
                <div className="flex justify-between items-center mt-4 pt-2 border-t border-white/5">
                  <p className="text-[9px] text-neutral-500 font-mono">UNIT: Rp {item.price.toLocaleString()}</p>
                  <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1 border border-white/5">
                    <button 
                      onClick={() => updateQty(item.uniqueKey, -1)} 
                      className="w-6 h-6 flex items-center justify-center text-red-500 active:scale-75 transition-transform"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-xs font-mono w-6 text-center text-white">{item.qty}</span>
                    <button 
                      onClick={() => updateQty(item.uniqueKey, 1)} 
                      className="w-6 h-6 flex items-center justify-center text-green-500 active:scale-75 transition-transform"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Checkout Panel */}
        <div className="p-6 bg-[#0a0a0a] border-t border-white/10 space-y-4">
          {cart.length > 0 && (
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">SHIPMENT DETAILS</span>
              <input 
                type="text" 
                placeholder="YOUR NAME" 
                className="w-full bg-white/5 border border-white/5 py-3 px-3 rounded-lg text-xs font-bold uppercase tracking-wider placeholder:font-mono placeholder:text-neutral-600 focus:border-[#FBC02D] outline-none text-white transition-all" 
                value={customerName} 
                onChange={(e) => setCustomerName(e.target.value)} 
              />
              <input 
                type="tel" 
                placeholder="WHATSAPP NUMBER" 
                className="w-full bg-white/5 border border-white/5 py-3 px-3 rounded-lg text-xs font-bold uppercase tracking-wider placeholder:font-mono placeholder:text-neutral-600 focus:border-[#FBC02D] outline-none text-white transition-all" 
                value={whatsapp} 
                onChange={(e) => setWhatsapp(e.target.value)} 
              />
            </div>
          )}
          <div className="flex justify-between items-end pb-2 pt-2">
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Total Amount</span>
            <span className="text-xl font-black text-white"><span className="text-[#FBC02D] text-xs mr-1">RP</span>{totalAmount.toLocaleString()}</span>
          </div>
          
          <button
            onClick={handleCheckout}
            disabled={!isFormValid}
            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
              isFormValid 
                ? 'bg-[#FBC02D] text-black hover:bg-yellow-500 shadow-xl shadow-[#FBC02D]/10 active:scale-95 cursor-pointer' 
                : 'bg-white/5 text-neutral-600 border border-white/5 cursor-not-allowed'
            }`}
          >
            Order via WhatsApp <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 35s linear infinite; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#FBC02D] rounded-full animate-ping"></div>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
