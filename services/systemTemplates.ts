
import { EmailBlock, Template, EmailBodyStyle, EmailBlockStyle, ListItem, EmailBlockType } from '../types';

// --- ASSETS ---
const IMAGES = {
    logos: {
        dark: 'https://placehold.co/150x40/1e293b/ffffff?text=BRAND',
        light: 'https://placehold.co/150x40/ffffff/1e293b?text=BRAND',
        color: 'https://placehold.co/150x40/transparent/2563eb?text=BRAND'
    },
    fashion: [
        'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80', // Hero
        'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=400&q=80', // Clothes
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80', // Shoes
    ],
    tech: [
        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80', // Workplace
        'https://images.unsplash.com/photo-1498049860654-af1a5c5668ba?auto=format&fit=crop&w=400&q=80', // Laptop
        'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=80'  // Circuit
    ],
    event: [
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80', // Conference
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', // Speaker 1
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'  // Speaker 2
    ],
    minimal: [
        'https://cdn.jsdelivr.net/gh/devhoanganh/mailflow-frontend@main/src/assets/check-circle.png' // Checkmark
    ]
};

// --- THEMES ---
const THEMES = {
    modern: { 
        bg: '#F3F4F6', card: '#FFFFFF', primary: '#2563EB', text: '#1F2937', secText: '#6B7280', 
        font: 'Helvetica, sans-serif', radius: '12px' 
    },
    dark_luxury: { 
        bg: '#0F172A', card: '#1E293B', primary: '#F59E0B', text: '#F9FAFB', secText: '#9CA3AF', 
        font: "'Playfair Display', serif", radius: '0px' 
    },
    vibrant: { 
        bg: '#FFF7ED', card: '#FFFFFF', primary: '#EA580C', text: '#431407', secText: '#9A3412', 
        font: 'Arial, sans-serif', radius: '24px' 
    },
    minimal: { 
        bg: '#FFFFFF', card: '#FFFFFF', primary: '#10B981', text: '#111827', secText: '#6B7280', 
        font: "'Courier New', monospace", radius: '4px' 
    }
};

// --- HELPERS ---
const createId = () => crypto.randomUUID();
const createStyle = (overrides: EmailBlockStyle = {}): EmailBlockStyle => ({
    paddingTop: '0px', paddingBottom: '0px', paddingLeft: '0px', paddingRight: '0px',
    marginTop: '0px', marginBottom: '0px', marginLeft: '0px', marginRight: '0px',
    ...overrides
});

const createBlock = (type: EmailBlockType, content: string = '', style: EmailBlockStyle = {}, children: EmailBlock[] = [], extra: any = {}): EmailBlock => ({
    id: createId(), type, content, style: createStyle(style), children, ...extra
});

// Updated helper signatures to be more flexible with style overrides
const createSection = (children: EmailBlock[], styleOverrides: EmailBlockStyle = {}) =>
    createBlock('section', '', styleOverrides, children);

const createRow = (children: EmailBlock[], styleOverrides: EmailBlockStyle = {}) =>
    createBlock('row', '', styleOverrides, children);

const createColumn = (children: EmailBlock[], styleOverrides: EmailBlockStyle = {}) =>
    createBlock('column', '', styleOverrides, children);

const createText = (content: string, styleOverrides: EmailBlockStyle = {}) =>
    createBlock('text', content, styleOverrides);

const createImage = (src: string, alt: string, styleOverrides: EmailBlockStyle = {}) =>
    createBlock('image', src, styleOverrides, [], { altText: alt });

const createButton = (text: string, url: string, styleOverrides: EmailBlockStyle = {}) =>
    createBlock('button', text, styleOverrides, [], { url });

const createSpacer = (styleOverrides: EmailBlockStyle = {}) =>
    createBlock('spacer', '', styleOverrides);

const createDivider = (styleOverrides: EmailBlockStyle = {}) =>
    createBlock('divider', '', styleOverrides);

// --- TEMPLATE BUILDERS ---

// 1. Welcome Series (Modern)
const buildWelcome = (): Template => {
    const t = THEMES.modern;
    const blocks: EmailBlock[] = [];

    // Header
    blocks.push(createSection([
        createRow([
            createColumn([createImage(IMAGES.logos.color, 'Logo', {width: '140px', textAlign: 'center'})], { width: '100%', verticalAlign: 'middle' })
        ], { backgroundColor: t.bg, paddingTop: '20px', paddingBottom: '20px' })
    ], { backgroundColor: t.bg }));

    // Hero
    blocks.push(createSection([
        createRow([
            createColumn([createImage(IMAGES.fashion[0], 'Welcome', { width: '100%', borderRadius: `${t.radius} ${t.radius} 0 0` })])
        ], { backgroundColor: t.card, paddingTop: '0px', paddingBottom: '0px', borderRadius: t.radius, shadowBlur: '15px', shadowColor: 'rgba(0,0,0,0.05)', shadowY: '4px' }) // shadow: 'true' converted
    ], { backgroundColor: t.bg, paddingTop: '0px', paddingBottom: '0px', paddingLeft: '20px', paddingRight: '20px' }));

    // Content
    blocks.push(createSection([
        createRow([
            createColumn([
                createSpacer({ height: '20px' }),
                createText(`<h1>Chào mừng bạn gia nhập!</h1>`, { fontSize: '28px', fontWeight: 'bold', color: t.text, textAlign: 'center', paddingTop: '0px', paddingBottom: '0px' }),
                createText('<p>Cảm ơn bạn đã đăng ký thành viên. Chúng tôi rất vui mừng được đồng hành cùng bạn trên hành trình khám phá phong cách mới.</p>', { fontSize: '16px', fontWeight: 'normal', color: t.secText, textAlign: 'center', paddingTop: '10px', paddingBottom: '10px', paddingLeft: '30px', paddingRight: '30px', lineHeight: '1.5' }),
                createButton('Khám phá ngay', '#', { contentBackgroundColor: t.primary, color: '#FFFFFF', textAlign: 'center', borderRadius: t.radius, marginTop: '20px' }),
                createSpacer({ height: '20px' }),
            ])
        ], { backgroundColor: t.card, paddingTop: '0px', paddingBottom: '0px', borderRadius: `0 0 ${t.radius} ${t.radius}`, shadowBlur: '15px', shadowColor: 'rgba(0,0,0,0.05)', shadowY: '4px' }) // shadow: 'true' converted
    ], { backgroundColor: t.bg, paddingTop: '0px', paddingBottom: '0px', paddingLeft: '20px', paddingRight: '20px' }));

    // Footer
    blocks.push(createSection([
        createRow([
            createColumn([
                createSpacer({ height: '30px' }),
                createText(`&copy; 2024 YourCompany. All rights reserved.`, { fontSize: '12px', fontWeight: 'normal', color: t.secText, textAlign: 'center', paddingTop: '0px', paddingBottom: '0px' }),
                createText(`<a href="{{unsubscribe_url}}" style="color:${t.secText}; text-decoration:underline;">Unsubscribe</a>`, { fontSize: '12px', fontWeight: 'normal', color: t.secText, textAlign: 'center', paddingTop: '0px', paddingBottom: '0px' }),
                createSpacer({ height: '30px' }),
            ])
        ], { backgroundColor: t.bg, paddingTop: '20px', paddingBottom: '20px' })
    ], { backgroundColor: t.bg }));

    return {
        id: createId(),
        name: 'Welcome Series (Fashion)',
        thumbnail: 'https://img.mailkit.app/img/templates/mk_template_fashion_1.png',
        category: 'welcome',
        lastModified: new Date().toISOString(),
        blocks: blocks,
        bodyStyle: {
            backgroundColor: t.bg,
            contentWidth: '600px',
            contentBackgroundColor: t.bg,
            fontFamily: t.font,
            linkColor: t.primary
        }
    };
};

export const SYSTEM_TEMPLATES: Template[] = [
    buildWelcome(),
    // Add other templates here as needed
];
