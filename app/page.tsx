"use client";

import React, { useState } from 'react';
import Link from 'next/link';
// IMPORT KOMPONEN IMAGE DARI NEXT.JS (PENTING!)
import Image from 'next/image';
import { ArrowRight, MapPin, Instagram, Mail, Phone, Clock } from 'lucide-react';

export default function Home() {
  // STATE: Mengatur peta mana yang sedang aktif (Default: TERNATE)
  const [activeLocation, setActiveLocation] = useState<'TERNATE' | 'MALANG'>('TERNATE');

  // DATA MAPS
  const MAP_URLS = {
    TERNATE: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.4481887171173!2d127.37825959999999!3d0.7804454!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x329cb340d864b2d1%3A0x66d9692e4f854607!2sTITIKNOL%20COFFEE%20RESERVE!5e0!3m2!1sid!2sid!4v1768506658674!5m2!1sid!2sid",
    MALANG: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3951.5272532585122!2d112.606026!3d-7.944338699999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7883002bbcd8d1%3A0xf114946e5877c360!2sTITIK%20NOL%20COFFEE%20RESERVE!5e0!3m2!1sid!2sid!4v1768506721835!5m2!1sid!2sid"
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#F5F5F5] font-sans selection:bg-[#FBC02D] selection:text-black">
      
      {/* 1. NAVBAR */}
      <nav className="fixed top-0 w-full p-6 flex justify-between items-center z-50 mix-blend-difference">
        <h1 className="text-xl font-black tracking-tighter">TITIK NOL<span className="text-[#FBC02D]">.</span></h1>
        <span className="text-xs font-mono text-[#FBC02D] tracking-widest border border-[#FBC02D] px-2 py-1">
          EST. 2020
        </span>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="h-screen w-full flex flex-col justify-center items-center px-4 relative border-b border-[#FBC02D]/20">
        <div className="absolute inset-0 border-x border-[#FBC02D]/10 w-3/4 mx-auto pointer-events-none"></div>
        <div className="absolute inset-0 border-y border-[#FBC02D]/10 h-3/4 my-auto pointer-events-none"></div>

        <div className="text-center z-10">
          <p className="text-[#FBC02D] font-mono tracking-[0.3em] text-sm mb-6 animate-pulse">WELCOME TO THE RESERVE</p>
          <h2 className="text-[15vw] leading-[0.8] font-black tracking-tighter uppercase mb-8">
            BREW<br />
            <span className="text-transparent stroke-text">CULTURE</span>
          </h2>
          <Link 
            href="/menu" 
            className="group inline-flex items-center gap-4 bg-[#E64A19] text-white px-8 py-4 md:px-10 md:py-5 text-lg font-bold tracking-widest hover:bg-white hover:text-black transition-all duration-300"
          >
            <span>EXPLORE MENU</span>
            <ArrowRight className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
        
        <div className="absolute bottom-10 animate-bounce">
          <p className="text-[10px] text-gray-500 font-mono tracking-widest">SCROLL TO DISCOVER</p>
        </div>
      </section>

      {/* 3. GALLERY SECTION (UPDATED DENGAN FOTO) */}
      <section className="w-full border-b border-[#FBC02D]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 h-auto lg:h-[600px]">
          
          {/* BOX 1: TEKS */}
          <div className="p-12 border-b md:border-b-0 md:border-r border-[#FBC02D]/20 flex flex-col justify-between bg-[#1A1A1A]">
            <div>
              <span className="text-[#FBC02D] font-mono text-xs mb-2 block">01 — ATMOSPHERE</span>
              <h3 className="text-4xl font-black uppercase leading-none">THE<br/>SPACE.</h3>
            </div>
            <p className="text-sm text-gray-400 mt-8">
              Titik Nol Coffee ~ Reserve itu sebuah Nama
Kedai kecil kami yang awal mula berdiri di
pinggiran trotoar jalan tanah tinggi depan
rumah sakit.
            </p>
          </div>
          
          {/* BOX 2: IMAGE PLACEHOLDER (Bisa diganti nanti) */}
          <div className="bg-[#252525] border-b md:border-b-0 md:border-r border-[#FBC02D]/20 relative group overflow-hidden min-h-[300px]">
            <div className="absolute inset-0 flex items-center justify-center text-gray-600 font-mono text-xs">
               <Image
               src="/img/IMG_8565.jpg" // Path dari folder public
               alt="Titik Nol Coffee Reserve - Signature Coffee"
               fill // Agar gambar mengisi penuh kotak pembungkusnya
               sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw" // Optimasi loading
               className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-500"
             />
            </div>
            <div className="absolute inset-0 bg-[#E64A19]/0 group-hover:bg-[#E64A19]/20 transition-colors duration-500 z-10"></div>
          </div>

          {/* BOX 3: IMAGE COFFEE (UPDATED!!!) */}
          <div className="bg-[#303030] border-b md:border-b-0 md:border-r border-[#FBC02D]/20 relative group overflow-hidden min-h-[300px]">
             {/* NEXT/IMAGE COMPONENT DI SINI */}
             <Image
               src="/img/IMG_8587.jpg" // Path dari folder public
               alt="Titik Nol Coffee Reserve - Signature Coffee"
               fill // Agar gambar mengisi penuh kotak pembungkusnya
               sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw" // Optimasi loading
               className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-500"
             />
            {/* Overlay Warna Orange saat Hover */}
            <div className="absolute inset-0 bg-[#E64A19]/0 group-hover:bg-[#E64A19]/20 transition-colors duration-500 z-10"></div>
          </div>

          {/* BOX 4: QUOTE */}
          <div className="p-12 flex items-center justify-center bg-[#FBC02D] text-black min-h-[300px]">
             <h4 className="text-2xl font-bold text-center leading-tight">"COFFEE IS NOT A BEVERAGE. TO THE LAST DROP POINT"</h4>
          </div>
        </div>
      </section>

      {/* 4. LOCATION & MAPS (INTERACTIVE) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 border-b border-[#FBC02D]">
        
        {/* Kolom Kiri: Daftar Outlet (Clickable) */}
        <div className="p-8 lg:p-20 border-b lg:border-b-0 lg:border-r border-[#FBC02D]/20 bg-[#1A1A1A]">
           <span className="text-[#FBC02D] font-mono text-xs mb-4 block">02 — LOCATIONS</span>
           <h3 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4">
             OUR<br/><span className="text-transparent stroke-text-thin">OUTLETS</span>
           </h3>
           <p className="text-gray-500 text-xs font-mono mb-12 animate-pulse">
             [ CLICK LOCATION TO VIEW MAP ]
           </p>
           
           <div className="space-y-8">
             {/* Outlet 1: Ternate (Clickable) */}
             <div 
               onClick={() => setActiveLocation('TERNATE')}
               className={`group cursor-pointer transition-all duration-300 ${activeLocation === 'TERNATE' ? 'opacity-100 translate-x-4' : 'opacity-40 hover:opacity-100'}`}
             >
               <div className="flex items-center gap-3 mb-2">
                 <MapPin className={`${activeLocation === 'TERNATE' ? 'text-[#FBC02D]' : 'text-gray-500'}`} size={20} />
                 <h4 className={`text-xl font-bold uppercase ${activeLocation === 'TERNATE' ? 'text-[#FBC02D]' : 'text-white'}`}>
                   TITIK NOL TERNATE
                 </h4>
                 {activeLocation === 'TERNATE' && (
                   <span className="text-[10px] bg-[#FBC02D] text-black px-2 py-0.5 font-bold tracking-widest animate-pulse">VIEWING</span>
                 )}
               </div>
               <p className="text-gray-400 pl-8 text-sm leading-relaxed border-l border-[#333] ml-2">
                 Lg. Melati, Tanah Tinggi Bar., Kota Ternate,<br/>Maluku Utara.
               </p>
             </div>

             {/* Outlet 2: Malang (Clickable) */}
             <div 
               onClick={() => setActiveLocation('MALANG')}
               className={`group cursor-pointer transition-all duration-300 ${activeLocation === 'MALANG' ? 'opacity-100 translate-x-4' : 'opacity-40 hover:opacity-100'}`}
             >
               <div className="flex items-center gap-3 mb-2">
                 <MapPin className={`${activeLocation === 'MALANG' ? 'text-[#FBC02D]' : 'text-gray-500'}`} size={20} />
                 <h4 className={`text-xl font-bold uppercase ${activeLocation === 'MALANG' ? 'text-[#FBC02D]' : 'text-white'}`}>
                   TITIK NOL MALANG
                 </h4>
                 {activeLocation === 'MALANG' && (
                   <span className="text-[10px] bg-[#FBC02D] text-black px-2 py-0.5 font-bold tracking-widest animate-pulse">VIEWING</span>
                 )}
               </div>
               <p className="text-gray-400 pl-8 text-sm leading-relaxed border-l border-[#333] ml-2">
                 Jl. Ikan Tombro, Mojolangu, Kec. Lowokwaru,<br/>Kota Malang, Jawa Timur.
               </p>
             </div>

             {/* Outlet Coming Soon (Non-Clickable) */}
             <div className="opacity-30 pt-8 border-t border-gray-800 mt-8">
               <div className="flex items-center gap-3 mb-2">
                 <Clock className="text-gray-500" size={16} />
                 <h4 className="text-sm font-bold uppercase text-gray-500">COMING SOON: BACAN & BALI</h4>
               </div>
             </div>
           </div>
        </div>

        {/* Kolom Kanan: Peta Dinamis */}
        <div className="bg-[#222] min-h-[500px] relative border-l border-[#FBC02D]/10">
          {/* Iframe Peta */}
          <iframe 
            src={MAP_URLS[activeLocation]} 
            width="100%" 
            height="100%" 
            style={{ border: 0, filter: 'grayscale(100%) invert(90%)' }} // Efek Filter Peta Gelap
            allowFullScreen={true} 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 w-full h-full object-cover"
          ></iframe>
          
          {/* Overlay agar warna peta tidak terlalu terang/nabrak desain */}
          <div className="absolute inset-0 bg-[#E64A19]/10 pointer-events-none mix-blend-overlay"></div>
          
          {/* Label Lokasi di Pojok Peta */}
          <div className="absolute bottom-6 left-6 bg-black border border-[#FBC02D] px-4 py-2 pointer-events-none">
            <p className="text-[#FBC02D] text-xs font-mono font-bold uppercase tracking-widest">
              CURRENT MAP: {activeLocation}
            </p>
          </div>
        </div>
      </section>

      {/* 5. FOOTER / CONTACT */}
      <footer className="bg-black py-20 px-6 border-t border-[#FBC02D]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          
          <div>
            <h2 className="text-3xl font-black uppercase mb-6">TITIK NOL RESERVE.</h2>
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-gray-400 hover:text-[#FBC02D] transition-colors">
                <Mail size={18} />
                <a href="mailto:titiknolcoffeereserver@gmail.com" className="text-sm font-mono">titiknolcoffeereserver@gmail.com</a>
              </div>
              <div className="flex items-center gap-3 text-gray-400 hover:text-[#FBC02D] transition-colors">
                <Phone size={18} />
                <a href="https://wa.me/6282195383783" target="_blank" className="text-sm font-mono">+62 821-9538-3783</a>
              </div>
            </div>
            
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 border border-gray-700 flex items-center justify-center hover:bg-[#FBC02D] hover:text-black transition-colors">
                <Instagram size={18} />
              </a>
            </div>
          </div>

          <div className="md:text-right flex flex-col items-start md:items-end justify-between">
             <div>
               <p className="text-[#FBC02D] font-bold mb-2">OPENING HOURS</p>
               <p className="text-gray-400">Monday - Sunday</p>
               <p className="text-2xl font-bold">08:00 - 23:00</p>
             </div>
             <div className="mt-8 border border-[#FBC02D] px-3 py-1 inline-block">
               <span className="text-[#FBC02D] text-[10px] font-bold tracking-widest uppercase">Halal Certified</span>
             </div>
          </div>

        </div>
        
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-gray-900 flex flex-col md:flex-row justify-between text-xs text-gray-600 font-mono">
          <p>© 2026 TITIK NOL COFFEE. ALL RIGHTS RESERVED.</p>
          <p>DESIGNED & DEV@ALE.</p>
        </div>
      </footer>

      <style jsx>{`
        .stroke-text {
          -webkit-text-stroke: 2px #F5F5F5;
        }
        .stroke-text-thin {
          -webkit-text-stroke: 1px #F5F5F5;
          color: transparent;
        }
      `}</style>
    </div>
  );
}