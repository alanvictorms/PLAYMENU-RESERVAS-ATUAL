(() => {
      'use strict';

      const $ = (selector, root = document) => root.querySelector(selector);
      const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
      const clone = value => JSON.parse(JSON.stringify(value));
      const uid = () => 'el_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
      const esc = value => String(value ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
      const escAttr = value => esc(value).replace(/'/g, '&#39;');
      const safeUrl = value => {
        const url = String(value || '').trim();
        if (!url) return '#';
        if (/^(https?:|mailto:|tel:|sms:|whatsapp:|blob:|data:application\/pdf)/i.test(url)) return url;
        if (/^#/.test(url)) return url;
        return 'https://' + url.replace(/^\/+/, '');
      };
      const nl2br = value => esc(value).replace(/\n/g, '<br>');
      const STORAGE_KEY = 'playmenu_bio_projects_mobile_v2';
      const API_BASE = window.PLAYMENU_BIO_API || '';
      const authHeaders = (extra = {}) => ({ ...extra, Authorization: `Bearer ${localStorage.getItem('playmenu_token') || ''}` });
      let remoteProjects = [];
      const apiUrl = path => `${API_BASE}${path}`;

      const componentDefinitions = [
        { category: 'Essenciais', type: 'profile', icon: '🏪', name: 'Perfil do negócio', description: 'Logo, capa, nome e descrição' },
        { category: 'Essenciais', type: 'button', icon: '🔗', name: 'Botão de link', description: 'Cardápio, pedidos ou qualquer URL' },
        { category: 'Essenciais', type: 'linksGrid', icon: '▦', name: 'Links em grade', description: 'Atalhos compactos em duas colunas' },
        { category: 'Essenciais', type: 'heading', icon: 'T', name: 'Título de seção', description: 'Organize o conteúdo da página' },
        { category: 'Essenciais', type: 'text', icon: '¶', name: 'Texto', description: 'Aviso, descrição ou observação' },
        { category: 'Cardápio e vendas', type: 'menu', icon: '🍽️', name: 'Categorias do cardápio', description: 'Entradas, pratos, bebidas e mais' },
        { category: 'Cardápio e vendas', type: 'product', icon: '🍔', name: 'Produto em destaque', description: 'Foto, preço e botão de pedido' },
        { category: 'Cardápio e vendas', type: 'promo', icon: '🏷️', name: 'Promoção ou cupom', description: 'Oferta com código e validade' },
        { category: 'Cardápio e vendas', type: 'whatsapp', icon: '💬', name: 'Pedido no WhatsApp', description: 'Mensagem pronta para converter' },
        { category: 'Cardápio e vendas', type: 'delivery', icon: '🛵', name: 'Canais de delivery', description: 'iFood, Rappi e pedido próprio' },
        { category: 'Cardápio e vendas', type: 'reservation', icon: '📅', name: 'Reservas', description: 'Mesa, evento ou atendimento' },
        { category: 'Conteúdo visual', type: 'gallery', icon: '🖼️', name: 'Galeria de fotos', description: 'Ambiente, pratos e bastidores' },
        { category: 'Conteúdo visual', type: 'video', icon: '▶️', name: 'Vídeo em destaque', description: 'Reel, apresentação ou anúncio' },
        { category: 'Informações', type: 'location', icon: '📍', name: 'Localização', description: 'Endereço e rota no mapa' },
        { category: 'Informações', type: 'hours', icon: '🕒', name: 'Horários', description: 'Funcionamento por dia' },
        { category: 'Informações', type: 'social', icon: '♡', name: 'Redes sociais', description: 'Instagram, TikTok e outras' },
        { category: 'Informações', type: 'testimonial', icon: '★', name: 'Avaliação de cliente', description: 'Depoimento e nota' },
        { category: 'Informações', type: 'wifi', icon: '📶', name: 'Wi-Fi do local', description: 'Rede e senha para clientes' },
        { category: 'Informações', type: 'payments', icon: '💳', name: 'Formas de pagamento', description: 'Pix, cartões e dinheiro' },
        { category: 'Organização', type: 'divider', icon: '—', name: 'Divisor', description: 'Separe visualmente os blocos' },
        { category: 'Organização', type: 'spacer', icon: '↕', name: 'Espaçamento', description: 'Crie respiro entre seções' },
        { category: 'Conteúdo visual', type: 'banner', icon: '📣', name: 'Banner de divulgação', description: 'Imagem para campanha ou lançamento' },
        { category: 'Vendas e relacionamento', type: 'event', icon: '🎉', name: 'Evento', description: 'Data, imagem, descrição e inscrição' },
        { category: 'Informações', type: 'file', icon: '📄', name: 'Documento ou PDF', description: 'Cardápio, regulamento ou catálogo' },
        { category: 'Organização', type: 'footer', icon: '©', name: 'Rodapé', description: 'Créditos e informações finais' }
      ];

      const baseTheme = {
        backgroundMode: 'color', background: '#f7f3ef', backgroundImage: '', backgroundPosition: 'center top',
        primary: '#ff5b22', text: '#191614', muted: '#716a65', buttonText: '#ffffff',
        font: 'Inter', cardRadius: 18, blockGap: 12, horizontalPadding: 18, buttonStyle: 'filled', shadow: 'soft', socialStyle: 'circle',
        seoTitle: 'Meu estabelecimento', seoDescription: 'Conheça nosso cardápio, faça seu pedido e encontre todas as informações em um só lugar.',
        showBranding: true
      };

      const defaults = {
        profile: () => ({ businessName: 'Sabor & Brasa', category: 'Restaurante • Fortaleza', bio: 'Comida feita com ingredientes selecionados, sabor de verdade e atendimento que faz você se sentir em casa.', avatar: 'https://images.unsplash.com/photo-1572047635301-4858977e3d55?auto=format&fit=crop&w=300&q=85', cover: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=85', showStatus: true, statusText: 'Aberto agora' }),
        button: () => ({ label: 'Ver cardápio completo', subtitle: 'Conheça todos os nossos pratos', icon: '🍽️', iconPosition: 'left', actionType: 'external', url: '', anchorTarget: '', whatsappPhone: '5585999999999', whatsappMessage: 'Olá! Vim pelo Instagram.', instagramUrl: 'https://instagram.com', platformPath: '#cardapio', documentUrl: '', documentName: '', newTab: true }),
        linksGrid: () => ({ title: 'Acessos rápidos', items: '🍽️ | Cardápio | #cardapio\n💬 | WhatsApp | https://wa.me/5585999999999\n📍 | Como chegar | https://maps.google.com\n📸 | Instagram | https://instagram.com' }),
        heading: () => ({ text: 'Destaques', subtitle: 'Veja o que preparamos para você' }),
        text: () => ({ text: 'Aceitamos pedidos todos os dias. Consulte disponibilidade, tempo de preparo e taxa de entrega pelo WhatsApp.' }),
        menu: () => ({ title: 'Nosso cardápio', subtitle: 'Escolha uma categoria', items: '🍔 | Hambúrgueres | 12 opções | #hamburgueres\n🍕 | Pizzas | 18 sabores | #pizzas\n🍟 | Porções | Para compartilhar | #porcoes\n🥤 | Bebidas | Geladas | #bebidas' }),
        product: () => ({ image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85', title: 'Brasa Supreme', description: 'Pão brioche, carne artesanal, cheddar, bacon crocante, cebola caramelizada e molho especial.', price: 'R$ 34,90', oldPrice: 'R$ 39,90', badge: 'Mais pedido', buttonLabel: 'Pedir agora', url: 'https://wa.me/5585999999999' }),
        promo: () => ({ eyebrow: 'Oferta exclusiva da bio', title: '10% OFF no primeiro pedido', text: 'Use o cupom abaixo ao fazer seu pedido pelo WhatsApp.', code: 'BEMVINDO10', linkLabel: 'Fazer pedido', url: 'https://wa.me/5585999999999' }),
        whatsapp: () => ({ label: 'Fazer pedido pelo WhatsApp', subtitle: 'Resposta rápida durante o horário de atendimento', iconPosition: 'left', phone: '5585999999999', message: 'Olá! Vim pelo Instagram e gostaria de fazer um pedido.', icon: '💬' }),
        delivery: () => ({ title: 'Peça onde preferir', subtitle: 'Escolha seu canal de entrega', ifood: 'https://www.ifood.com.br', rappi: 'https://www.rappi.com.br', own: 'https://wa.me/5585999999999' }),
        reservation: () => ({ title: 'Reserve sua mesa', text: 'Garanta seu lugar com antecedência.', label: 'Fazer reserva', url: 'https://wa.me/5585999999999?text=Gostaria%20de%20reservar%20uma%20mesa' }),
        gallery: () => ({ title: 'Um pouco do nosso sabor', images: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=500&q=85\nhttps://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=85\nhttps://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=85\nhttps://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=85\nhttps://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=500&q=85\nhttps://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=500&q=85', columns: 3 }),
        video: () => ({ title: 'Conheça nossa experiência', subtitle: 'Assista ao vídeo', cover: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=85', url: 'https://instagram.com' }),
        location: () => ({ title: 'Onde estamos', address: 'Av. Beira Mar, 1000 — Meireles, Fortaleza - CE', reference: 'Próximo à avenida principal', url: 'https://maps.google.com' }),
        hours: () => ({ title: 'Horário de funcionamento', schedule: 'Segunda a quinta | 11h às 23h\nSexta e sábado | 11h à 00h\nDomingo | 11h às 22h' }),
        social: () => ({ instagram: 'https://instagram.com', tiktok: 'https://tiktok.com', facebook: 'https://facebook.com', youtube: '', website: '' }),
        testimonial: () => ({ quote: 'Comida maravilhosa, atendimento rápido e um ambiente muito agradável. Voltarei mais vezes!', name: 'Mariana S.', role: 'Cliente', rating: 5 }),
        wifi: () => ({ title: 'Wi-Fi para clientes', network: 'SaborEBrasa_Clientes', password: 'sabor123', text: 'Conecte-se e marque nosso perfil nos seus stories.' }),
        payments: () => ({ title: 'Formas de pagamento', methods: 'Pix\nDinheiro\nVisa\nMastercard\nElo\nVale-refeição' }),
        divider: () => ({}),
        banner: () => ({ image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=85', title: 'Novidade no cardápio', subtitle: 'Conheça nossa seleção especial', url: '#cardapio' }),
        event: () => ({ image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=85', date: 'Sábado • 20h', title: 'Noite especial', description: 'Música, gastronomia e uma experiência preparada para você.', buttonLabel: 'Reservar lugar', url: 'https://wa.me/5585999999999' }),
        file: () => ({ title: 'Baixar cardápio em PDF', description: 'Consulte preços e opções.', fileUrl: '', fileName: 'cardapio.pdf' }),
        spacer: () => ({ height: 28 }),
        footer: () => ({ text: '© 2026 Sabor & Brasa. Todos os direitos reservados.', showPowered: true })
      };

      const styleDefaults = () => ({ background: '', borderColor: '', borderRadius: '', padding: '', align: '', marginTop: 0, marginBottom: 0, shadow: '' });
      const makeElement = (type, data = {}, style = {}) => ({
        id: uid(), type, hidden: false,
        data: { ...defaults[type](), ...data },
        style: { ...styleDefaults(), ...style },
        textStyles: {},
        customId: '', customClass: ''
      });

      const presets = [
        {
          id: 'modern', name: 'Bistrô Moderno', description: 'Elegante, versátil e focado em reservas.', colors: ['#17120f','#f2e7d8','#d98b42'], thumb: 'linear-gradient(145deg,#1b1714,#5a3520)',
          theme: { ...baseTheme, background: '#f4eee7', primary: '#a84f28', text: '#211a16', muted: '#74675f', font: 'Inter', cardRadius: 20, buttonStyle: 'filled' },
          elements: () => [
            makeElement('profile', { businessName: 'Casa Amora', category: 'Bistrô contemporâneo', bio: 'Cozinha autoral, ingredientes frescos e experiências feitas para compartilhar.', avatar: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=300&q=85', cover: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=85', statusText: 'Reservas disponíveis' }),
            makeElement('button', { label: 'Reservar uma mesa', subtitle: 'Escolha data e horário', icon: '📅', url: 'https://wa.me/5585999999999' }),
            makeElement('button', { label: 'Conhecer o cardápio', subtitle: 'Entradas, principais e sobremesas', icon: '🍽️', url: '#cardapio' }),
            makeElement('heading', { text: 'Experiências em destaque', subtitle: 'Uma seleção especial da nossa cozinha' }),
            makeElement('product', { title: 'Risoto de camarões', description: 'Arroz arbóreo, camarões, limão siciliano, parmesão e ervas frescas.', price: 'R$ 68', oldPrice: '', badge: 'Chef recomenda', image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=85' }),
            makeElement('gallery'), makeElement('location'), makeElement('hours'), makeElement('social'), makeElement('footer', { text: '© 2026 Casa Amora' })
          ]
        },
        {
          id: 'burger', name: 'Hamburgueria Impacto', description: 'Visual forte, promoções e pedido rápido.', colors: ['#101010','#ffb000','#e33621'], thumb: 'linear-gradient(145deg,#151515,#532006)',
          theme: { ...baseTheme, background: '#111111', primary: '#ffb000', text: '#ffffff', muted: '#bcbcbc', buttonText: '#111111', font: 'Poppins', cardRadius: 16, buttonStyle: 'filled', shadow: 'strong' },
          elements: () => [
            makeElement('profile', { businessName: 'BRASA 85', category: 'Smash Burger • Fortaleza', bio: 'Smash de verdade, ingredientes selecionados e entrega rápida.', avatar: 'https://images.unsplash.com/photo-1586816001966-79b736744398?auto=format&fit=crop&w=300&q=85', cover: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=85', statusText: 'Pedidos abertos' }),
            makeElement('whatsapp', { label: 'PEDIR AGORA', subtitle: 'Atendimento rápido no WhatsApp' }),
            makeElement('promo', { title: 'Combo em dobro hoje', text: 'Na compra de 2 burgers, a batata grande sai pela metade do preço.', code: 'BRASA50' }),
            makeElement('heading', { text: 'Os mais pedidos', subtitle: 'Escolha seu favorito' }),
            makeElement('product'),
            makeElement('product', { title: 'Duplo Bacon Melt', description: 'Dois smash burgers, cheddar cremoso, bacon e molho da casa.', price: 'R$ 39,90', oldPrice: '', badge: 'Novidade', image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=900&q=85' }),
            makeElement('delivery'), makeElement('location'), makeElement('social'), makeElement('footer', { text: '© 2026 BRASA 85' })
          ]
        },
        {
          id: 'pizza', name: 'Pizzaria Artesanal', description: 'Cardápio por categorias e delivery.', colors: ['#fff7e6','#c43c24','#25613b'], thumb: 'linear-gradient(145deg,#f4d8a5,#a93220)',
          theme: { ...baseTheme, background: '#fff8ea', primary: '#c53c24', text: '#2b211c', muted: '#74655d', font: 'Inter', cardRadius: 22, buttonStyle: 'soft' },
          elements: () => [
            makeElement('profile', { businessName: 'Forno da Vila', category: 'Pizza artesanal • Massa de longa fermentação', bio: 'Sabores clássicos e autorais preparados no forno de pedra.', avatar: 'https://images.unsplash.com/photo-1593504049359-74330189a345?auto=format&fit=crop&w=300&q=85', cover: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=900&q=85', statusText: 'Forno ligado' }),
            makeElement('whatsapp', { label: 'Pedir pelo WhatsApp', subtitle: 'Monte seu pedido em poucos minutos', icon: '🍕' }),
            makeElement('menu', { items: '🍕 | Pizzas tradicionais | 20 sabores | #tradicionais\n🧀 | Pizzas especiais | Receitas autorais | #especiais\n🌱 | Vegetarianas | Opções sem carne | #vegetarianas\n🥤 | Bebidas | Refrigerantes e sucos | #bebidas' }),
            makeElement('product', { title: 'Margherita da Vila', description: 'Molho artesanal, muçarela, tomate, manjericão e azeite.', price: 'R$ 54,90', oldPrice: '', badge: 'Clássica', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=85' }),
            makeElement('promo', { title: 'Terça em dobro', text: 'Compre uma pizza grande e ganhe outra tradicional.', code: 'TERCAEMDOBRO' }),
            makeElement('delivery'), makeElement('hours'), makeElement('location'), makeElement('social'), makeElement('footer', { text: '© 2026 Forno da Vila' })
          ]
        },
        {
          id: 'acai', name: 'Açaí & Sorveteria', description: 'Colorido, jovem e com links rápidos.', colors: ['#3d145d','#b7eb55','#ff78ae'], thumb: 'linear-gradient(145deg,#3d145d,#a83fa2)',
          theme: { ...baseTheme, background: '#f8f1ff', primary: '#6e2d8d', text: '#2b1733', muted: '#755e7e', font: 'Poppins', cardRadius: 24, buttonStyle: 'filled' },
          elements: () => [
            makeElement('profile', { businessName: 'Açaí Mood', category: 'Açaí • Sorvetes • Cremes', bio: 'Monte do seu jeito, escolha os adicionais e aproveite cada colherada.', avatar: 'https://images.unsplash.com/photo-1590080874088-eec64895b423?auto=format&fit=crop&w=300&q=85', cover: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=85', statusText: 'Entrega até 23h' }),
            makeElement('linksGrid', { items: '🥣 | Montar meu açaí | https://wa.me/5585999999999\n🛵 | Pedir no iFood | https://ifood.com.br\n🏷️ | Promoções | #promocoes\n📍 | Loja mais próxima | https://maps.google.com' }),
            makeElement('promo', { title: 'Adicional grátis', text: 'Escolha um adicional grátis em pedidos acima de R$ 30.', code: 'MOODGRATIS' }),
            makeElement('gallery', { title: 'Escolha seu mood' }), makeElement('testimonial'), makeElement('hours'), makeElement('social'), makeElement('footer', { text: '© 2026 Açaí Mood' })
          ]
        },
        {
          id: 'coffee', name: 'Cafeteria Aconchegante', description: 'Leve, editorial e sofisticado.', colors: ['#eee3d5','#5c3b2a','#b88b5e'], thumb: 'linear-gradient(145deg,#efe2d0,#72503a)',
          theme: { ...baseTheme, background: '#eee6dc', primary: '#6f4934', text: '#2a211d', muted: '#75665d', font: 'Playfair Display', cardRadius: 18, buttonStyle: 'outline' },
          elements: () => [
            makeElement('profile', { businessName: 'Café Aurora', category: 'Cafeteria artesanal', bio: 'Cafés especiais, brunch e doces preparados todos os dias.', avatar: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=300&q=85', cover: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=900&q=85', statusText: 'Café sendo passado' }),
            makeElement('button', { label: 'Ver menu do dia', subtitle: 'Cafés, brunch e confeitaria', icon: '☕', url: '#menu' }),
            makeElement('heading', { text: 'Feito para desacelerar', subtitle: 'Conheça nossas escolhas do dia' }),
            makeElement('product', { title: 'Cappuccino Aurora', description: 'Espresso duplo, leite vaporizado, cacau e canela.', price: 'R$ 16', oldPrice: '', badge: 'Favorito', image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=900&q=85' }),
            makeElement('video', { title: 'Do grão à xícara', subtitle: 'Conheça nosso preparo', cover: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=900&q=85' }),
            makeElement('location'), makeElement('hours'), makeElement('wifi'), makeElement('social'), makeElement('footer', { text: '© 2026 Café Aurora' })
          ]
        },
        {
          id: 'minimal', name: 'Minimalista Direto', description: 'Simples, rápido e focado nos links.', colors: ['#ffffff','#171717','#ef5b2a'], thumb: 'linear-gradient(145deg,#f3f3f3,#cfcfcf)',
          theme: { ...baseTheme, background: '#ffffff', primary: '#ef5b2a', text: '#161616', muted: '#727272', font: 'Inter', cardRadius: 14, buttonStyle: 'outline', shadow: 'none' },
          elements: () => [
            makeElement('profile', { businessName: 'Seu Estabelecimento', category: 'Comida boa perto de você', bio: 'Acesse nosso cardápio, faça pedidos e fale com a equipe pelos botões abaixo.', cover: '', showStatus: false }),
            makeElement('button', { label: 'Abrir cardápio', subtitle: '', icon: '🍽️' }),
            makeElement('whatsapp', { label: 'Falar no WhatsApp', subtitle: '', icon: '💬' }),
            makeElement('button', { label: 'Pedir no iFood', subtitle: '', icon: '🛵', url: 'https://ifood.com.br' }),
            makeElement('location'), makeElement('hours'), makeElement('social'), makeElement('footer', { text: '© 2026 Seu Estabelecimento' })
          ]
        }
      ];

      presets.push(
        {
          id: 'sushi', name: 'Sushi Premium', description: 'Escuro, elegante e focado em combinados.', colors: ['#101114','#f5e7cf','#d8a23a'], thumb: 'linear-gradient(145deg,#0b0c0e,#5b1c1c)',
          theme: { ...baseTheme, background: '#101114', primary: '#c99437', text: '#f8f2e8', muted: '#aaa59e', buttonText: '#111', font: 'Inter', cardRadius: 18, buttonStyle: 'filled', shadow: 'strong' },
          elements: () => [
            makeElement('profile', { businessName: 'Nori House', category: 'Sushi • Temaki • Sashimi', bio: 'Cortes frescos, combinações autorais e uma experiência japonesa completa.', avatar: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=300&q=85', cover: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=85', statusText: 'Pedidos disponíveis' }),
            makeElement('button', { label: 'Ver combinados', subtitle: 'Escolha seu favorito', icon: '🍣', actionType: 'anchor', anchorTarget: '' }),
            makeElement('product', { title: 'Combinado Nori 32 peças', description: 'Seleção de sashimis, niguiris e uramakis.', price: 'R$ 129,90', oldPrice: '', badge: 'Chef recomenda', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=85' }),
            makeElement('delivery'), makeElement('hours'), makeElement('location'), makeElement('social'), makeElement('footer', { text: '© 2026 Nori House' })
          ]
        },
        {
          id: 'bakery', name: 'Padaria Artesanal', description: 'Acolhedor, claro e perfeito para encomendas.', colors: ['#fff7e9','#6d3e26','#d88d45'], thumb: 'linear-gradient(145deg,#f8ddae,#8b4a27)',
          theme: { ...baseTheme, background: '#fff8ed', primary: '#b8622c', text: '#3a261b', muted: '#806b5f', font: 'Playfair Display', cardRadius: 22, buttonStyle: 'soft' },
          elements: () => [
            makeElement('profile', { businessName: 'Pão da Casa', category: 'Padaria artesanal • Encomendas', bio: 'Pães de fermentação natural, bolos e cafés preparados todos os dias.', avatar: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=85', cover: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=85', statusText: 'Fornada saindo' }),
            makeElement('whatsapp', { label: 'Fazer encomenda', subtitle: 'Pães, bolos e kits', icon: '🥖' }),
            makeElement('gallery', { title: 'Feito hoje' }), makeElement('product', { title: 'Cesta de café da manhã', description: 'Seleção de pães, geleias, frutas e café.', price: 'R$ 79,90', oldPrice: '', badge: 'Encomenda', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=85' }),
            makeElement('hours'), makeElement('location'), makeElement('social'), makeElement('footer', { text: '© 2026 Pão da Casa' })
          ]
        },
        {
          id: 'healthy', name: 'Saudável & Fresh', description: 'Leve, vibrante e focado em refeições saudáveis.', colors: ['#f4fff6','#217a45','#f4a340'], thumb: 'linear-gradient(145deg,#d8f5dc,#247c4a)',
          theme: { ...baseTheme, background: '#f4fff6', primary: '#247a48', text: '#153724', muted: '#65806e', font: 'Poppins', cardRadius: 24, buttonStyle: 'filled' },
          elements: () => [
            makeElement('profile', { businessName: 'Verde no Pote', category: 'Bowls • Saladas • Sucos', bio: 'Comida leve, ingredientes frescos e combinações que cabem na sua rotina.', avatar: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=85', cover: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=85', statusText: 'Entrega no almoço' }),
            makeElement('linksGrid', { items: '🥗 | Montar meu bowl | #bowls\n🧃 | Ver sucos | #sucos\n💬 | Pedir no WhatsApp | https://wa.me/5585999999999\n📍 | Como chegar | https://maps.google.com' }),
            makeElement('product', { title: 'Bowl Energia', description: 'Folhas, quinoa, frango, avocado, tomate e molho cítrico.', price: 'R$ 32,90', oldPrice: '', badge: 'Mais pedido', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=85' }),
            makeElement('testimonial'), makeElement('hours'), makeElement('social'), makeElement('footer', { text: '© 2026 Verde no Pote' })
          ]
        },
        {
          id: 'bar', name: 'Bar & Música', description: 'Noturno, energético e ideal para eventos.', colors: ['#11101a','#f53d6b','#8b5cf6'], thumb: 'linear-gradient(145deg,#161322,#8b1e4a)',
          theme: { ...baseTheme, background: '#11101a', primary: '#f53d6b', text: '#ffffff', muted: '#b8b2c6', font: 'Poppins', cardRadius: 20, buttonStyle: 'filled', shadow: 'strong' },
          elements: () => [
            makeElement('profile', { businessName: 'Distrito 12', category: 'Bar • Música • Drinks', bio: 'Drinks autorais, petiscos e uma programação diferente toda semana.', avatar: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=300&q=85', cover: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=900&q=85', statusText: 'Aberto até 2h' }),
            makeElement('event', { date: 'Sexta • 22h', title: 'Noite de música ao vivo', description: 'Reserve sua mesa e confira a atração da semana.', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=85' }),
            makeElement('reservation'), makeElement('banner', { title: 'Happy hour', subtitle: 'Todos os dias, das 18h às 20h' }), makeElement('location'), makeElement('hours'), makeElement('social'), makeElement('footer', { text: '© 2026 Distrito 12' })
          ]
        },
        {
          id: 'foodtruck', name: 'Food Truck Urbano', description: 'Direto, jovem e preparado para localização itinerante.', colors: ['#18202a','#ff6a2a','#f7ce46'], thumb: 'linear-gradient(145deg,#18202a,#a53d18)',
          theme: { ...baseTheme, background: '#18202a', primary: '#ff6a2a', text: '#ffffff', muted: '#b9c0ca', font: 'Inter', cardRadius: 15, buttonStyle: 'filled' },
          elements: () => [
            makeElement('profile', { businessName: 'Truck 21', category: 'Street food • Agenda itinerante', bio: 'Comida de rua com personalidade. Veja onde estaremos hoje.', avatar: 'https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?auto=format&fit=crop&w=300&q=85', cover: 'https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?auto=format&fit=crop&w=900&q=85', statusText: 'Atendendo agora' }),
            makeElement('location', { title: 'Localização de hoje', address: 'Praça Central — das 18h às 23h', reference: 'Próximo ao palco principal' }),
            makeElement('menu'), makeElement('whatsapp', { label: 'Fazer pedido para retirada', subtitle: 'Evite filas', icon: '🚚' }), makeElement('social'), makeElement('footer', { text: '© 2026 Truck 21' })
          ]
        },
        {
          id: 'steakhouse', name: 'Steakhouse Luxo', description: 'Sofisticado, escuro e voltado para reservas.', colors: ['#15120f','#d6b46b','#eee5d5'], thumb: 'linear-gradient(145deg,#17130f,#5c3b24)',
          theme: { ...baseTheme, background: '#15120f', primary: '#cba45b', text: '#f5ead7', muted: '#aa9c89', buttonText: '#1b1711', font: 'Playfair Display', cardRadius: 18, buttonStyle: 'filled', shadow: 'strong' },
          elements: () => [
            makeElement('profile', { businessName: 'Gran Corte', category: 'Steakhouse • Vinhos', bio: 'Cortes selecionados, fogo de parrilla e serviço pensado em cada detalhe.', avatar: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=300&q=85', cover: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85', statusText: 'Reservas disponíveis' }),
            makeElement('reservation'), makeElement('product', { title: 'Prime Rib na parrilla', description: 'Corte maturado, legumes na brasa e molho da casa.', price: 'R$ 148', oldPrice: '', badge: 'Experiência', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85' }),
            makeElement('gallery'), makeElement('location'), makeElement('hours'), makeElement('social'), makeElement('footer', { text: '© 2026 Gran Corte' })
          ]
        }
      );

      const iconChoices = ['', '🍽️','💬','🛵','📍','📅','📸','🎉','🏷️','☕','🍔','🍕','🍣','🥗','🥖','🍰','🍹','📄','▶️','⭐','🔗','🛍️','🚚','🎁','📞'];
      const paymentChoices = ['Pix','Dinheiro','Visa','Mastercard','Elo','American Express','Vale-refeição','Vale-alimentação','Apple Pay','Google Pay'];
      const textSizeChoices = {
        small: { label: 'Pequeno', css: 'calc(var(--text-base-size, 1em) * .86)' },
        medium: { label: 'Médio', css: '' },
        large: { label: 'Grande', css: 'calc(var(--text-base-size, 1em) * 1.22)' }
      };
      const textWeightChoices = {
        thin: { label: 'Fina', css: 300 },
        regular: { label: 'Regular', css: 500 },
        black: { label: 'Black', css: 800 }
      };
      const textFontChoices = [
        { value: '', label: 'Fonte do modelo' },
        { value: 'Inter', label: 'Inter' },
        { value: 'Poppins', label: 'Poppins' },
        { value: 'Roboto', label: 'Roboto' },
        { value: 'Playfair Display', label: 'Playfair' }
      ];

      let state = {
        projectId: uid(),
        projectName: 'Minha página',
        theme: clone(presets[0].theme),
        elements: presets[0].elements(),
        selectedId: null,
        inspectorTab: 'content'
      };
      let history = [];
      let historyIndex = -1;
      let recordTimer = null;
      let confirmCallback = null;
      let activeSheet = null;
      let canvasSortable = null;
      let layersSortable = null;
      let assetTarget = null;
      let pendingAssetValue = '';
      let pendingAssetName = '';
      let previewPresetId = null;
      let paletteDrag = null;
      let suppressPaletteClickUntil = 0;

      const refs = {
        canvas: $('#bioCanvas'),
        phoneScreen: $('#phoneScreen'),
        projectName: $('#projectName'),
        inspectorBody: $('#inspectorBody'),
        inspectorTitle: $('#inspectorTitle'),
        inspectorSubtitle: $('#inspectorSubtitle'),
        componentPalette: $('#componentPalette'),
        componentSearch: $('#componentSearch'),
        insertPosition: $('#insertPosition'),
        presetList: $('#presetList'),
        layerList: $('#layerList'),
        designPanel: $('#designPanel'),
        projectList: $('#projectList'),
        selectedEditFab: $('#selectedEditFab'),
        sheetBackdrop: $('#sheetBackdrop'),
        assetPreview: $('#assetPreview'),
        assetFileInput: $('#assetFileInput'),
        assetUrlInput: $('#assetUrlInput'),
        presetPreviewCanvas: $('#presetPreviewCanvas'),
        presetPreviewTitle: $('#presetPreviewTitle'),
        presetPreviewUse: $('#presetPreviewUse')
      };

      function iconFor(type) { return componentDefinitions.find(item => item.type === type)?.icon || '▣'; }
      function nameFor(type) { return componentDefinitions.find(item => item.type === type)?.name || type; }
      function getSelected() { return state.elements.find(element => element.id === state.selectedId) || null; }
      function layerTitle(element) { return element.data.businessName || element.data.label || element.data.title || element.data.text || nameFor(element.type); }
      function elementAnchor(element) { return element.customId?.trim() || `bloco-${element.id}`; }

      function parseLines(value, count = Infinity) {
        return String(value || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean).slice(0, count);
      }
      function parsePipes(value, expected = 4) {
        return parseLines(value).map(line => {
          const parts = line.split('|').map(part => part.trim());
          while (parts.length < expected) parts.push('');
          return parts;
        });
      }
      function pipesToString(rows) { return rows.map(row => row.map(value => String(value || '').trim()).join(' | ')).join('\n'); }

      function blockStyle(element) {
        const style = element.style || {};
        const shadows = { none: 'none', soft: '0 8px 24px rgba(17,24,39,.07)', strong: '0 14px 34px rgba(17,24,39,.17)' };
        return [
          style.background !== '' ? `--block-bg:${style.background || 'transparent'}` : '',
          style.borderColor !== '' ? `--block-border:${style.borderColor || 'transparent'}` : '',
          style.borderRadius !== '' ? `--block-radius:${Number(style.borderRadius)}px` : '',
          style.padding !== '' ? `--block-padding:${Number(style.padding)}px` : '',
          style.align ? `--block-align:${style.align}` : '',
          style.shadow ? `--block-shadow:${shadows[style.shadow] || style.shadow}` : '',
          style.marginTop ? `margin-top:${Number(style.marginTop)}px` : '',
          style.marginBottom ? `margin-bottom:${Number(style.marginBottom)}px` : ''
        ].filter(Boolean).join(';');
      }

      function resolveActionUrl(data) {
        const type = data.actionType || 'external';
        if (type === 'anchor') return data.anchorTarget ? `#${String(data.anchorTarget).replace(/^#/, '')}` : '#';
        if (type === 'whatsapp') {
          const phone = String(data.whatsappPhone || '').replace(/\D/g, '');
          return `https://wa.me/${phone}?text=${encodeURIComponent(data.whatsappMessage || 'Olá! Vim pelo Instagram.')}`;
        }
        if (type === 'instagram') return data.instagramUrl || 'https://instagram.com';
        if (type === 'document') return data.documentUrl || '#';
        if (type === 'menu' || type === 'reservation') return data.platformPath || (type === 'menu' ? '#cardapio' : '#reservas');
        return data.url || '#';
      }
      function linkAttrs(value, newTab = true) {
        const url = typeof value === 'object' ? resolveActionUrl(value) : value;
        const isAnchor = /^#/.test(String(url || ''));
        const target = newTab && !isAnchor ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `href="${escAttr(safeUrl(url))}"${target}`;
      }

      function normalizeTextStyle(element, key) {
        element.textStyles = element.textStyles || {};
        return element.textStyles[key] || {};
      }

      function textStyle(element, key) {
        const value = normalizeTextStyle(element, key);
        const declarations = [];
        if (value.color) declarations.push(`color:${value.color}`);
        if (value.font) declarations.push(`font-family:'${String(value.font).replace(/'/g, "\\'")}',sans-serif`);
        if (value.size && textSizeChoices[value.size]?.css) declarations.push(`font-size:${textSizeChoices[value.size].css}`);
        if (value.weight && textWeightChoices[value.weight]) declarations.push(`font-weight:${textWeightChoices[value.weight].css}`);
        return declarations.join(';');
      }

      function tx(element, key, value, tag = 'span', options = {}) {
        const { html = false, attrs = '', className = '' } = options;
        const style = textStyle(element, key);
        const classAttr = className ? ` class="${escAttr(className)}"` : '';
        const styleAttr = style ? ` style="${escAttr(style)}"` : '';
        return `<${tag}${classAttr}${styleAttr}${attrs ? ` ${attrs}` : ''}>${html ? value : esc(value)}</${tag}>`;
      }

      function renderElement(element) {
        const data = element.data;
        const style = blockStyle(element);
        const anchor = elementAnchor(element);
        const classSuffix = element.customClass ? ` ${escAttr(element.customClass)}` : '';
        const baseAttr = `id="${escAttr(anchor)}" class="bio-component${classSuffix}" style="${escAttr(style)}"`;
        const linkedAttr = `id="${escAttr(anchor)}" style="${escAttr(style)}"`;
        const buttonStyle = `button-${state.theme.buttonStyle}`;

        switch (element.type) {
          case 'profile':
            return `<section ${baseAttr}><div class="bio-profile profile-block">${data.cover ? `<div class="bio-cover" style="background-image:url('${escAttr(data.cover)}')"></div>` : ''}<img class="bio-avatar" src="${escAttr(data.avatar)}" alt="Logo de ${escAttr(data.businessName)}" onerror="this.style.visibility='hidden'">${tx(element,'category',data.category,'div',{className:'category'})}${tx(element,'businessName',data.businessName,'h1')}${tx(element,'bio',nl2br(data.bio),'p',{html:true})}${data.showStatus ? `<div class="status-pill"><span class="status-dot"></span>${tx(element,'statusText',data.statusText,'span')}</div>` : ''}</div></section>`;
          case 'button': {
            const icon = data.icon ? `<span class="link-icon">${esc(data.icon)}</span>` : '';
            const pos = ['left','center','right'].includes(data.iconPosition) ? data.iconPosition : 'left';
            return `<a ${linkedAttr} class="bio-component bio-block bio-link ${buttonStyle} icon-${pos}${data.icon ? '' : ' no-icon'}${classSuffix}" ${linkAttrs(data, data.newTab !== false)}>${pos === 'left' ? icon : ''}<span class="link-copy">${tx(element,'label',data.label,'strong')}${data.subtitle ? tx(element,'subtitle',data.subtitle,'small') : ''}</span>${pos === 'center' ? icon : ''}${pos === 'right' ? icon : ''}<span class="link-arrow">›</span></a>`;
          }
          case 'linksGrid': {
            const items = parsePipes(data.items, 3).map(([icon,label,url], index) => `<a class="grid-link" ${linkAttrs(url)}><span>${esc(icon || '🔗')}</span>${tx(element,`items.${index}.1`,label,'strong')}</a>`).join('');
            return `<section ${baseAttr}><div class="bio-block"><div class="links-grid">${items}</div></div></section>`;
          }
          case 'heading': return `<section ${baseAttr}><div class="bio-heading">${tx(element,'text',data.text,'h2')}${data.subtitle ? tx(element,'subtitle',data.subtitle,'p') : ''}</div></section>`;
          case 'text': return `<section ${baseAttr}><div class="bio-text">${tx(element,'text',nl2br(data.text),'span',{html:true})}</div></section>`;
          case 'menu': {
            const items = parsePipes(data.items, 4).map(([icon,title,subtitle,url], index) => `<a class="menu-category" ${linkAttrs(url)}><span>${esc(icon || '🍽️')}</span><span>${tx(element,`items.${index}.1`,title,'strong')}${tx(element,`items.${index}.2`,subtitle,'small')}</span></a>`).join('');
            return `<section ${baseAttr}><div class="bio-block"><div class="bio-heading" style="padding:0 0 11px">${tx(element,'title',data.title,'h2')}${tx(element,'subtitle',data.subtitle,'p')}</div><div class="menu-categories">${items}</div></div></section>`;
          }
          case 'product': return `<section ${baseAttr}><article class="bio-block product-card"><div class="product-image" style="background-image:url('${escAttr(data.image)}')">${data.badge ? tx(element,'badge',data.badge,'span',{className:'product-badge'}) : ''}</div><div class="product-content"><div class="product-title-row">${tx(element,'title',data.title,'h3')}<div class="price">${data.oldPrice ? tx(element,'oldPrice',data.oldPrice,'span',{className:'old-price'}) : ''}${tx(element,'price',data.price,'span')}</div></div>${tx(element,'description',data.description,'p')}<a class="small-cta" ${linkAttrs(data.url)}>${tx(element,'buttonLabel',data.buttonLabel,'span')}</a></div></article></section>`;
          case 'promo': return `<section ${baseAttr}><article class="bio-block promo-card">${tx(element,'eyebrow',data.eyebrow,'div',{className:'promo-eyebrow'})}${tx(element,'title',data.title,'h3')}${tx(element,'text',data.text,'p')}<div class="coupon-row">${tx(element,'code',data.code,'span',{className:'coupon-code'})}<a ${linkAttrs(data.url)}>${tx(element,'linkLabel',`${data.linkLabel} →`,'span')}</a></div></article></section>`;
          case 'whatsapp': {
            const url = `https://wa.me/${String(data.phone || '').replace(/\D/g,'')}?text=${encodeURIComponent(data.message || 'Olá! Gostaria de fazer um pedido.')}`;
            const icon = data.icon ? `<span class="link-icon">${esc(data.icon)}</span>` : '';
            const pos = ['left','center','right'].includes(data.iconPosition) ? data.iconPosition : 'left';
            return `<a ${linkedAttr} class="bio-component bio-block bio-link ${buttonStyle} icon-${pos}${data.icon ? '' : ' no-icon'}${classSuffix}" ${linkAttrs(url)}>${pos === 'left' ? icon : ''}<span class="link-copy">${tx(element,'label',data.label,'strong')}${data.subtitle ? tx(element,'subtitle',data.subtitle,'small') : ''}</span>${pos === 'center' ? icon : ''}${pos === 'right' ? icon : ''}<span class="link-arrow">›</span></a>`;
          }
          case 'delivery': return `<section ${baseAttr}><div class="bio-block"><div class="bio-heading" style="padding:0 0 10px">${tx(element,'title',data.title,'h2')}${tx(element,'subtitle',data.subtitle,'p')}</div><div class="delivery-grid"><a class="delivery-item" ${linkAttrs(data.ifood)}><span>🟥</span><strong>iFood</strong></a><a class="delivery-item" ${linkAttrs(data.rappi)}><span>🟧</span><strong>Rappi</strong></a><a class="delivery-item" ${linkAttrs(data.own)}><span>💬</span><strong>Pedido direto</strong></a><a class="delivery-item" ${linkAttrs(data.own)}><span>🛍️</span><strong>Retirada</strong></a></div></div></section>`;
          case 'reservation': return `<section ${baseAttr}><div class="bio-block"><div class="info-row"><div class="info-row-icon">📅</div><div style="flex:1">${tx(element,'title',data.title,'strong')}${tx(element,'text',data.text,'span')}</div></div><a class="small-cta" style="margin-top:12px" ${linkAttrs(data.url)}>${tx(element,'label',data.label,'span')}</a></div></section>`;
          case 'gallery': {
            const images = parseLines(data.images, 12).map((src,index) => `<img src="${escAttr(src)}" alt="Foto ${index + 1} de ${escAttr(state.projectName)}" loading="lazy">`).join('');
            return `<section ${baseAttr}><div class="bio-heading">${tx(element,'title',data.title,'h2')}</div><div class="gallery" style="--gallery-cols:${Number(data.columns) || 3}">${images}</div></section>`;
          }
          case 'video': return `<a id="${escAttr(anchor)}" class="bio-component bio-block video-card${classSuffix}" style="${escAttr(style)};background-image:url('${escAttr(data.cover)}')" ${linkAttrs(data.url)}><span class="video-play">▶</span><span class="video-caption">${tx(element,'title',data.title,'strong')}${tx(element,'subtitle',data.subtitle,'small')}</span></a>`;
          case 'location': return `<section ${baseAttr}><div class="bio-block info-list"><div class="info-row"><div class="info-row-icon">📍</div><div>${tx(element,'title',data.title,'strong')}<a ${linkAttrs(data.url)}>${tx(element,'address',data.address,'span')}</a>${data.reference ? tx(element,'reference',data.reference,'span') : ''}</div></div></div></section>`;
          case 'hours': {
            const rows = parsePipes(data.schedule, 2).map(([day,time], index) => `<div class="hours-row">${tx(element,`schedule.${index}.0`,day,'span')}${tx(element,`schedule.${index}.1`,time,'span')}</div>`).join('');
            return `<section ${baseAttr}><div class="bio-block"><div class="info-row" style="margin-bottom:11px"><div class="info-row-icon">🕒</div><div>${tx(element,'title',data.title,'strong')}</div></div><div class="hours-list">${rows}</div></div></section>`;
          }
          case 'social': {
            const links = [['instagram','◎'],['tiktok','♪'],['facebook','f'],['youtube','▶'],['website','⌂']].filter(([key]) => data[key]).map(([key,icon]) => `<a class="social-link" ${linkAttrs(data[key])} aria-label="${key}">${icon}</a>`).join('');
            return `<section ${baseAttr}><div class="social-row">${links}</div></section>`;
          }
          case 'testimonial': return `<section ${baseAttr}><article class="bio-block testimonial"><div class="stars">${'★'.repeat(Math.max(1, Math.min(5, Number(data.rating) || 5)))}</div>${tx(element,'quote',`“${data.quote}”`,'blockquote')}<cite>${tx(element,'name',data.name,'strong')}${data.role ? ` ${tx(element,'role',`• ${data.role}`,'span')}` : ''}</cite></article></section>`;
          case 'wifi': return `<section ${baseAttr}><div class="bio-block"><div class="info-row"><div class="info-row-icon">📶</div><div>${tx(element,'title',data.title,'strong')}${tx(element,'text',data.text,'span')}</div></div><div class="wifi-code"><span><small style="display:block;color:var(--page-muted);font-size:8px">REDE</small>${tx(element,'network',data.network,'code')}</span><span><small style="display:block;color:var(--page-muted);font-size:8px">SENHA</small>${tx(element,'password',data.password,'code')}</span></div></div></section>`;
          case 'payments': {
            const methods = parseLines(data.methods, 12).map((method,index) => tx(element,`methods.${index}`,method,'span',{className:'payment-pill'})).join('');
            return `<section ${baseAttr}><div class="bio-block"><div class="info-row"><div class="info-row-icon">💳</div><div>${tx(element,'title',data.title,'strong')}</div></div><div class="payment-icons">${methods}</div></div></section>`;
          }
          case 'banner': return `<a id="${escAttr(anchor)}" class="bio-component bio-block banner-card${classSuffix}" style="${escAttr(style)};background-image:url('${escAttr(data.image)}')" ${linkAttrs(data.url)}><span class="banner-card__copy">${tx(element,'title',data.title,'strong')}${tx(element,'subtitle',data.subtitle,'small')}</span></a>`;
          case 'event': return `<section ${baseAttr}><article class="bio-block event-card"><div class="event-cover" style="background-image:url('${escAttr(data.image)}')"></div><div class="event-content">${tx(element,'date',data.date,'span',{className:'event-date'})}${tx(element,'title',data.title,'h3')}${tx(element,'description',data.description,'p')}<a class="small-cta" ${linkAttrs(data.url)}>${tx(element,'buttonLabel',data.buttonLabel,'span')}</a></div></article></section>`;
          case 'file': return `<a id="${escAttr(anchor)}" class="bio-component bio-block file-card${classSuffix}" style="${escAttr(style)}" ${linkAttrs(data.fileUrl)}><span class="file-card__icon">📄</span><span class="file-card__copy">${tx(element,'title',data.title,'strong')}${tx(element,'description',data.description || data.fileName,'small')}</span><span class="link-arrow">↓</span></a>`;
          case 'divider': return `<section ${baseAttr}><div class="bio-divider"></div></section>`;
          case 'spacer': return `<section ${baseAttr}><div class="bio-spacer" style="--spacer-height:${Number(data.height) || 28}px"></div></section>`;
          case 'footer': return `<footer ${baseAttr}><div class="bio-footer">${tx(element,'text',data.text,'span')}${data.showPowered && state.theme.showBranding ? '<br><span>Feito com <strong>PlayMenu Bio</strong></span>' : ''}</div></footer>`;
          default: return '';
        }
      }

      function pageVars(theme = state.theme) {
        const shadow = theme.shadow === 'none' ? 'none' : theme.shadow === 'strong' ? '0 14px 34px rgba(17,24,39,.17)' : '0 8px 24px rgba(17,24,39,.07)';
        const socialRadius = theme.socialStyle === 'square' ? '12px' : theme.socialStyle === 'rounded' ? '16px' : '50%';
        const imageEnabled = theme.backgroundMode === 'image' && theme.backgroundImage;
        return `--page-bg:${theme.background};--page-bg-image:${imageEnabled ? `url('${escAttr(theme.backgroundImage)}')` : 'none'};--page-bg-position:${escAttr(theme.backgroundPosition || 'center top')};--page-primary:${theme.primary};--page-text:${theme.text};--page-muted:${theme.muted};--button-text:${theme.buttonText};--page-font:'${escAttr(theme.font)}';--card-radius:${Number(theme.cardRadius)}px;--page-gap:${Number(theme.blockGap)}px;--block-shadow:${shadow};--social-radius:${socialRadius};--page-padding:${Number(theme.horizontalPadding)}px;padding-left:${Number(theme.horizontalPadding)}px;padding-right:${Number(theme.horizontalPadding)}px;`;
      }

      function editorNode(element) {
        const classes = ['editor-node'];
        if (element.hidden) classes.push('is-hidden');
        if (element.id === state.selectedId) classes.push('is-selected');
        return `<div class="${classes.join(' ')}" data-id="${element.id}" style="--node-gap:${state.theme.blockGap}px">
          <div class="node-tools" aria-label="Ações do bloco">
            <button class="node-tool node-drag-handle" type="button" data-node-action="drag" aria-label="Segure e arraste"><i class="bi bi-grip-vertical"></i></button>
            <button class="node-tool" type="button" data-node-action="edit" aria-label="Editar"><i class="bi bi-sliders"></i></button>
            <button class="node-tool" type="button" data-node-action="duplicate" aria-label="Duplicar"><i class="bi bi-copy"></i></button>
            <button class="node-tool" type="button" data-node-action="visibility" aria-label="${element.hidden ? 'Mostrar' : 'Ocultar'}"><i class="bi ${element.hidden ? 'bi-eye' : 'bi-eye-slash'}"></i></button>
            <button class="node-tool" type="button" data-node-action="delete" aria-label="Excluir"><i class="bi bi-x-lg"></i></button>
          </div>
          ${renderElement(element)}
        </div>`;
      }

      function renderCanvas() {
        refs.canvas.setAttribute('style', pageVars());
        refs.canvas.innerHTML = state.elements.length
          ? state.elements.map(editorNode).join('')
          : `<div class="canvas-empty"><div><i class="bi bi-plus-circle"></i><strong>Adicione o primeiro elemento</strong><small>Use o botão Adicionar na parte inferior da tela.</small></div></div>`;
        bindCanvasEvents();
        initCanvasSortable();
        refs.selectedEditFab.hidden = !state.selectedId;
      }

      function bindCanvasEvents() {
        refs.canvas.onclick = event => {
          const node = event.target.closest('.editor-node');
          if (!node) return;
          const action = event.target.closest('[data-node-action]');
          event.preventDefault();
          event.stopPropagation();
          state.selectedId = node.dataset.id;
          if (action) {
            const type = action.dataset.nodeAction;
            if (type === 'edit') openEditor();
            if (type === 'duplicate') duplicateSelected();
            if (type === 'visibility') toggleVisibility(state.selectedId);
            if (type === 'delete') askDelete(state.selectedId);
          } else {
            renderCanvas();
            renderLayers();
            renderInsertPositions();
          }
        };
        refs.canvas.querySelectorAll('a').forEach(link => link.addEventListener('click', event => event.preventDefault()));
      }

      function initCanvasSortable() {
        if (canvasSortable) canvasSortable.destroy();
        if (!window.Sortable || !state.elements.length) return;
        canvasSortable = new window.Sortable(refs.canvas, {
          animation: 220,
          handle: '.node-drag-handle',
          draggable: '.editor-node',
          delay: 190,
          delayOnTouchOnly: true,
          touchStartThreshold: 4,
          forceFallback: true,
          fallbackOnBody: true,
          fallbackTolerance: 3,
          chosenClass: 'is-picked-up',
          dragClass: 'is-dragging',
          ghostClass: 'sortable-ghost',
          scroll: refs.phoneScreen,
          bubbleScroll: true,
          scrollSensitivity: 75,
          scrollSpeed: 12,
          onChoose() { if (navigator.vibrate) navigator.vibrate(12); document.body.classList.add('builder-dragging'); },
          onUnchoose() { document.body.classList.remove('builder-dragging'); },
          onEnd(event) {
            document.body.classList.remove('builder-dragging');
            if (event.oldIndex === event.newIndex || event.oldIndex == null || event.newIndex == null) return renderCanvas();
            const [moved] = state.elements.splice(event.oldIndex, 1);
            state.elements.splice(event.newIndex, 0, moved);
            state.selectedId = moved.id;
            commit();
            renderAll(false);
            toast('Ordem atualizada.', 'success');
          }
        });
      }

      function renderInsertPositions() {
        if (!refs.insertPosition) return;
        const options = ['<option value="start">No início da página</option>'];
        state.elements.forEach(element => options.push(`<option value="after:${element.id}">Depois de: ${esc(layerTitle(element))}</option>`));
        options.push('<option value="end">No final da página</option>');
        refs.insertPosition.innerHTML = options.join('');
        refs.insertPosition.value = state.selectedId ? `after:${state.selectedId}` : 'end';
      }

      function insertElement(type, index, { openAfter = true } = {}) {
        const element = makeElement(type);
        const safeIndex = Math.max(0, Math.min(Number(index), state.elements.length));
        state.elements.splice(safeIndex, 0, element);
        state.selectedId = element.id;
        commit();
        renderAll(false);
        requestAnimationFrame(() => {
          const node = refs.canvas.querySelector(`[data-id="${element.id}"]`);
          node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (openAfter) setTimeout(openEditor, 260);
        });
        toast(`${nameFor(type)} adicionado.`, 'success');
        return element;
      }

      function addElement(type) {
        const position = refs.insertPosition.value || 'end';
        let index = state.elements.length;
        if (position === 'start') index = 0;
        if (position.startsWith('after:')) {
          const targetIndex = state.elements.findIndex(item => item.id === position.slice(6));
          index = targetIndex >= 0 ? targetIndex + 1 : state.elements.length;
        }
        insertElement(type, index);
        closeSheet();
      }

      function removePaletteDrag({ restoreSheet = true } = {}) {
        if (!paletteDrag) return;
        cancelAnimationFrame(paletteDrag.autoScrollFrame || 0);
        paletteDrag.ghost?.remove();
        paletteDrag.indicator?.remove();
        paletteDrag.button?.classList.remove('is-palette-source');
        document.body.classList.remove('builder-palette-dragging');
        activeSheet?.classList.remove('is-drag-source-collapsed');
        $('#phoneFrame')?.classList.remove('is-palette-drop-target','is-palette-drop-invalid');
        if (restoreSheet && activeSheet && window.innerWidth < 900) {
          refs.sheetBackdrop.hidden = false;
          requestAnimationFrame(() => refs.sheetBackdrop.classList.add('is-visible'));
        }
        paletteDrag = null;
      }

      function paletteDropIndex(clientY) {
        const nodes = [...refs.canvas.querySelectorAll('.editor-node')];
        for (let index = 0; index < nodes.length; index += 1) {
          const rect = nodes[index].getBoundingClientRect();
          if (clientY < rect.top + rect.height / 2) return index;
        }
        return nodes.length;
      }

      function updatePaletteDrag(event) {
        if (!paletteDrag) return;
        paletteDrag.x = event.clientX;
        paletteDrag.y = event.clientY;
        paletteDrag.ghost.style.transform = `translate3d(${event.clientX + 14}px,${event.clientY + 14}px,0)`;
        const screenRect = refs.phoneScreen.getBoundingClientRect();
        const valid = event.clientX >= screenRect.left - 18 && event.clientX <= screenRect.right + 18 &&
          event.clientY >= screenRect.top - 18 && event.clientY <= screenRect.bottom + 18;
        paletteDrag.valid = valid;
        const phone = $('#phoneFrame');
        phone?.classList.toggle('is-palette-drop-target', valid);
        phone?.classList.toggle('is-palette-drop-invalid', !valid);
        paletteDrag.indicator.remove();
        if (valid) {
          paletteDrag.index = paletteDropIndex(event.clientY);
          const nodes = [...refs.canvas.querySelectorAll('.editor-node')];
          if (nodes[paletteDrag.index]) refs.canvas.insertBefore(paletteDrag.indicator, nodes[paletteDrag.index]);
          else refs.canvas.appendChild(paletteDrag.indicator);
        }
      }

      function autoScrollPaletteDrag() {
        if (!paletteDrag) return;
        const rect = refs.phoneScreen.getBoundingClientRect();
        if (paletteDrag.valid && paletteDrag.y < rect.top + 70) refs.phoneScreen.scrollTop -= 10;
        if (paletteDrag.valid && paletteDrag.y > rect.bottom - 70) refs.phoneScreen.scrollTop += 10;
        paletteDrag.autoScrollFrame = requestAnimationFrame(autoScrollPaletteDrag);
      }

      function beginPaletteDrag(button, type, event) {
        suppressPaletteClickUntil = Date.now() + 700;
        const ghost = document.createElement('div');
        ghost.className = 'component-drag-ghost';
        ghost.innerHTML = `<span>${iconFor(type)}</span><strong>${esc(nameFor(type))}</strong>`;
        document.body.appendChild(ghost);
        const indicator = document.createElement('div');
        indicator.className = 'palette-drop-indicator';
        paletteDrag = { button, type, ghost, indicator, index: state.elements.length, valid: false, x:event.clientX, y:event.clientY, autoScrollFrame:0 };
        button.classList.add('is-palette-source');
        document.body.classList.add('builder-palette-dragging');
        if (window.innerWidth < 900) {
          activeSheet?.classList.add('is-drag-source-collapsed');
          refs.sheetBackdrop.classList.remove('is-visible');
        }
        if (navigator.vibrate) navigator.vibrate(18);
        updatePaletteDrag(event);
        autoScrollPaletteDrag();
      }

      function finishPaletteDrag(event) {
        if (!paletteDrag) return;
        updatePaletteDrag(event);
        const { valid, type, index } = paletteDrag;
        removePaletteDrag({ restoreSheet: !valid });
        if (valid) {
          insertElement(type, index, { openAfter:false });
          closeSheet();
        } else {
          toast('Arraste o elemento até a tela do celular.', 'error');
        }
      }

      function initPaletteDrag() {
        refs.componentPalette.querySelectorAll('[data-component-type]').forEach(button => {
          const handle = button.querySelector('.component-card__drag-hint') || button;
          let timer = null;
          let startX = 0;
          let startY = 0;
          let active = false;
          let pointerId = null;

          handle.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
          });
          handle.addEventListener('pointerdown', event => {
            if (event.button !== 0) return;
            event.preventDefault();
            event.stopPropagation();
            startX = event.clientX;
            startY = event.clientY;
            pointerId = event.pointerId;
            active = false;
            timer = setTimeout(() => {
              active = true;
              handle.setPointerCapture?.(pointerId);
              beginPaletteDrag(button, button.dataset.componentType, event);
            }, 230);
          });
          handle.addEventListener('pointermove', event => {
            if (!active && timer && Math.hypot(event.clientX - startX, event.clientY - startY) > 9) {
              clearTimeout(timer);
              timer = null;
            }
            if (active) {
              event.preventDefault();
              event.stopPropagation();
              updatePaletteDrag(event);
            }
          });
          const end = event => {
            if (timer) clearTimeout(timer);
            timer = null;
            if (active) {
              event.preventDefault();
              event.stopPropagation();
              active = false;
              finishPaletteDrag(event);
            }
            pointerId = null;
          };
          handle.addEventListener('pointerup', end);
          handle.addEventListener('pointercancel', event => {
            if (timer) clearTimeout(timer);
            timer = null;
            if (active) removePaletteDrag();
            active = false;
            pointerId = null;
            event.stopPropagation();
          });
        });
      }

      function duplicateSelected() {
        const element = getSelected();
        if (!element) return;
        const copy = clone(element);
        copy.id = uid();
        const index = state.elements.findIndex(item => item.id === element.id);
        state.elements.splice(index + 1, 0, copy);
        state.selectedId = copy.id;
        commit();
        renderAll(false);
        toast('Bloco duplicado.', 'success');
      }
      function toggleVisibility(id) {
        const element = state.elements.find(item => item.id === id);
        if (!element) return;
        element.hidden = !element.hidden;
        commit();
        renderAll(false);
      }
      function askDelete(id) {
        const element = state.elements.find(item => item.id === id);
        if (!element) return;
        openConfirm('Excluir bloco', `Deseja excluir “${layerTitle(element)}”? Você poderá usar Desfazer logo depois.`, () => {
          state.elements = state.elements.filter(item => item.id !== id);
          if (state.selectedId === id) state.selectedId = null;
          commit();
          renderAll(false);
          closeSheet();
          toast('Bloco excluído.', 'success');
        });
      }

      function renderPalette(filter = '') {
        const term = filter.trim().toLowerCase();
        const filtered = componentDefinitions.filter(component => !term || `${component.name} ${component.description} ${component.category}`.toLowerCase().includes(term));
        const categories = [...new Set(filtered.map(component => component.category))];
        refs.componentPalette.innerHTML = categories.length
          ? categories.map(category => `<h3 class="builder-category-title">${esc(category)}</h3><div class="component-grid">${filtered.filter(component => component.category === category).map(component => `<button class="component-card" type="button" data-component-type="${component.type}" aria-label="${escAttr(component.name)}. Toque para adicionar ou segure para arrastar."><span class="component-card__drag-hint"><i class="bi bi-grip-horizontal"></i></span><span class="component-card__icon">${component.icon}</span><strong>${esc(component.name)}</strong><small>${esc(component.description)}</small></button>`).join('')}</div>`).join('')
          : '<div class="empty-panel"><div><i class="bi bi-search"></i><strong>Nenhum elemento encontrado</strong><small>Tente buscar com outra palavra.</small></div></div>';
        refs.componentPalette.querySelectorAll('[data-component-type]').forEach(button => button.addEventListener('click', event => {
          if (Date.now() < suppressPaletteClickUntil) {
            event.preventDefault();
            return;
          }
          addElement(button.dataset.componentType);
        }));
        initPaletteDrag();
      }

      function presetCard(preset) {
        return `<article class="preset-card"><div class="preset-thumb" style="background:${preset.thumb}"><div class="mini-page" style="background:${preset.colors[0]};color:${preset.colors[1]}"><div class="mini-avatar"></div><div class="mini-line w1" style="background:${preset.colors[1]}"></div><div class="mini-line w2" style="background:${preset.colors[1]}"></div><div class="mini-button" style="background:${preset.colors[2]}"></div><div class="mini-card"></div><div class="mini-button" style="background:${preset.colors[1]}"></div></div></div><div class="preset-info"><strong>${esc(preset.name)}</strong><small>${esc(preset.description)}</small><div class="preset-actions"><button type="button" class="preset-preview-button" data-preview-preset="${preset.id}"><i class="bi bi-eye"></i> Visualizar</button><button type="button" class="preset-use-button" data-apply-preset="${preset.id}">Usar modelo</button></div></div></article>`;
      }

      function renderPresets() {
        refs.presetList.innerHTML = presets.map(presetCard).join('');
        refs.presetList.querySelectorAll('[data-apply-preset]').forEach(button => button.onclick = () => applyPreset(button.dataset.applyPreset));
        refs.presetList.querySelectorAll('[data-preview-preset]').forEach(button => button.onclick = () => previewPreset(button.dataset.previewPreset));
      }

      function previewPreset(id) {
        const preset = presets.find(item => item.id === id);
        if (!preset || !refs.presetPreviewCanvas) return;
        previewPresetId = id;
        const previousTheme = state.theme;
        state.theme = clone(preset.theme);
        const elements = preset.elements();
        refs.presetPreviewCanvas.setAttribute('style', pageVars(state.theme));
        refs.presetPreviewCanvas.innerHTML = elements.filter(element => !element.hidden).map(renderElement).join('');
        state.theme = previousTheme;
        refs.presetPreviewTitle.textContent = preset.name;
        window.bootstrap?.Modal.getOrCreateInstance($('#presetPreviewModal')).show();
      }

      function applyPreset(id) {
        window.bootstrap?.Modal.getInstance($('#presetPreviewModal'))?.hide();
        const preset = presets.find(item => item.id === id);
        if (!preset) return;
        openConfirm('Aplicar modelo', `O modelo “${preset.name}” substituirá os blocos e a aparência atuais.`, () => {
          state.theme = clone(preset.theme);
          state.elements = preset.elements();
          state.selectedId = null;
          commit();
          renderAll(false);
          closeSheet();
          refs.phoneScreen.scrollTo({ top: 0, behavior: 'smooth' });
          toast(`Modelo “${preset.name}” aplicado.`, 'success');
        });
      }

      function renderLayers() {
        refs.layerList.innerHTML = state.elements.length
          ? state.elements.map(element => `<div class="layer-item ${element.id === state.selectedId ? 'is-selected' : ''}" data-layer-id="${element.id}"><button class="layer-grip" type="button" aria-label="Segure e arraste"><i class="bi bi-grip-vertical"></i></button><span class="layer-icon">${iconFor(element.type)}</span><span class="layer-name"><strong>${esc(layerTitle(element))}</strong><small>${esc(nameFor(element.type))}</small></span><button class="layer-action" type="button" data-layer-action="visibility" aria-label="${element.hidden ? 'Mostrar' : 'Ocultar'}"><i class="bi ${element.hidden ? 'bi-eye' : 'bi-eye-slash'}"></i></button><button class="layer-action" type="button" data-layer-action="delete" aria-label="Excluir"><i class="bi bi-trash3"></i></button></div>`).join('')
          : '<div class="empty-panel"><div><i class="bi bi-layers"></i><strong>Nenhum bloco adicionado</strong><small>Use o botão Adicionar para começar.</small></div></div>';
        refs.layerList.querySelectorAll('[data-layer-id]').forEach(item => {
          item.onclick = event => {
            const action = event.target.closest('[data-layer-action]');
            state.selectedId = item.dataset.layerId;
            if (action?.dataset.layerAction === 'visibility') toggleVisibility(state.selectedId);
            else if (action?.dataset.layerAction === 'delete') askDelete(state.selectedId);
            else {
              renderCanvas();
              renderLayers();
              renderInsertPositions();
            }
          };
        });
        initLayersSortable();
      }

      function initLayersSortable() {
        if (layersSortable) layersSortable.destroy();
        if (!window.Sortable || !state.elements.length) return;
        layersSortable = new window.Sortable(refs.layerList, {
          animation: 220,
          handle: '.layer-grip',
          draggable: '.layer-item',
          delay: 180,
          delayOnTouchOnly: true,
          touchStartThreshold: 4,
          forceFallback: true,
          fallbackOnBody: true,
          chosenClass: 'is-picked-up',
          dragClass: 'is-dragging',
          ghostClass: 'sortable-ghost',
          scroll: true,
          scrollSensitivity: 70,
          scrollSpeed: 12,
          onChoose() { if (navigator.vibrate) navigator.vibrate(12); document.body.classList.add('builder-dragging'); },
          onUnchoose() { document.body.classList.remove('builder-dragging'); },
          onEnd(event) {
            document.body.classList.remove('builder-dragging');
            if (event.oldIndex === event.newIndex || event.oldIndex == null || event.newIndex == null) return renderLayers();
            const [moved] = state.elements.splice(event.oldIndex, 1);
            state.elements.splice(event.newIndex, 0, moved);
            state.selectedId = moved.id;
            commit();
            renderAll(false);
            toast('Ordem atualizada.', 'success');
          }
        });
      }

      function getTextStyleValue(key) {
        const element = getSelected();
        return element?.textStyles?.[key] || {};
      }

      function textStyleTools(key) {
        const current = getTextStyleValue(key);
        const color = /^#[0-9a-f]{6}$/i.test(current.color || '') ? current.color : '#ffffff';
        const transparent = !current.color;
        return `<div class="field-style-tools">
          <span class="field-color-control ${transparent ? 'is-inherit' : ''}" style="--field-color:${escAttr(color)}" title="Cor do texto">
            <input type="color" value="${escAttr(color)}" data-text-color="${escAttr(key)}" aria-label="Cor do texto">
            <i class="bi bi-palette-fill"></i>
            <button type="button" data-clear-text-color="${escAttr(key)}" aria-label="Usar cor padrão" title="Usar cor padrão"><i class="bi bi-x"></i></button>
          </span>
          <button class="field-type-control" type="button" data-toggle-text-style="${escAttr(key)}" aria-label="Tipografia do texto" title="Fonte, tamanho e espessura"><span>Aa</span></button>
        </div>
        <div class="text-style-panel" data-text-style-panel="${escAttr(key)}" hidden>
          <div class="text-style-panel__group"><span>Fonte</span><div class="text-style-fonts">${textFontChoices.map(option => `<button type="button" class="${String(option.value) === String(current.font || '') ? 'is-active' : ''}" data-text-style-key="${escAttr(key)}" data-text-style-prop="font" data-text-style-value="${escAttr(option.value)}">${esc(option.label)}</button>`).join('')}</div></div>
          <div class="text-style-panel__group"><span>Tamanho</span><div class="segmented-control" style="--segments:3">${Object.entries(textSizeChoices).map(([value, option]) => `<button type="button" class="${value === (current.size || 'medium') ? 'is-active' : ''}" data-text-style-key="${escAttr(key)}" data-text-style-prop="size" data-text-style-value="${value}">${esc(option.label)}</button>`).join('')}</div></div>
          <div class="text-style-panel__group"><span>Espessura</span><div class="segmented-control" style="--segments:3">${Object.entries(textWeightChoices).map(([value, option]) => `<button type="button" class="${value === current.weight ? 'is-active' : ''}" data-text-style-key="${escAttr(key)}" data-text-style-prop="weight" data-text-style-value="${value}">${esc(option.label)}</button>`).join('')}</div></div>
          <button class="text-style-reset" type="button" data-reset-text-style="${escAttr(key)}"><i class="bi bi-arrow-counterclockwise"></i> Usar tipografia do modelo</button>
        </div>`;
      }

      function textField(label, key, value, options = {}) {
        const { type = 'text', help = '', scope = 'data', placeholder = '', rerender = false, styleable = (scope === 'data' && type === 'text'), textStyleKey = key } = options;
        const input = `<input class="form-control" type="${type}" data-bind="${key}" data-scope="${scope}" ${rerender ? 'data-rerender="true"' : ''} value="${escAttr(value)}" placeholder="${escAttr(placeholder)}">`;
        return styleable ? styledFieldMarkup(label, input, textStyleKey, help) : `<label class="builder-field"><span>${label}</span>${input}${help ? `<small class="field-help">${help}</small>` : ''}</label>`;
      }

      function styledFieldMarkup(label, inputMarkup, key, help = '') {
        const tools = textStyleTools(key);
        const panelIndex = tools.indexOf('<div class="text-style-panel"');
        const controls = tools.slice(0, panelIndex);
        const panel = tools.slice(panelIndex);
        return `<div class="builder-field builder-field--styled"><span>${label}</span><div class="field-input-row">${inputMarkup}${controls}</div>${panel}${help ? `<small class="field-help">${help}</small>` : ''}</div>`;
      }

      function textareaField(label, key, value, options = {}) {
        const { help = '', scope = 'data', placeholder = '', styleable = scope === 'data', textStyleKey = key } = options;
        const input = `<textarea class="form-control" data-bind="${key}" data-scope="${scope}" placeholder="${escAttr(placeholder)}">${esc(value)}</textarea>`;
        return styleable ? styledFieldMarkup(label, input, textStyleKey, help) : `<label class="builder-field"><span>${label}</span>${input}${help ? `<small class="field-help">${help}</small>` : ''}</label>`;
      }

      function selectField(label, key, value, options, settings = {}) {
        const { help = '', scope = 'data', rerender = false } = settings;
        return `<label class="builder-field"><span>${label}</span><select class="form-select" data-bind="${key}" data-scope="${scope}" ${rerender ? 'data-rerender="true"' : ''}>${options.map(option => `<option value="${escAttr(option.value)}" ${String(option.value) === String(value) ? 'selected' : ''}>${esc(option.label)}</option>`).join('')}</select>${help ? `<small class="field-help">${help}</small>` : ''}</label>`;
      }

      function switchField(label, key, value, scope = 'data') {
        return `<label class="switch-row"><span>${label}</span><input class="form-check-input" type="checkbox" role="switch" data-bind="${key}" data-scope="${scope}" ${value ? 'checked' : ''}></label>`;
      }

      function rangeControl(label, key, value, min, max, suffix = 'px', scope = 'style') {
        const normalized = value === '' || value == null ? min : Number(value);
        return `<div class="range-control"><div class="range-control__head"><span>${label}</span><span class="range-control__value" data-range-output="${scope}:${key}">${normalized}${suffix}</span></div><input type="range" min="${min}" max="${max}" value="${normalized}" data-bind="${key}" data-scope="${scope}" data-suffix="${suffix}"></div>`;
      }

      function segmentedControl(label, key, value, options, scope = 'style') {
        return `<div class="builder-field"><span class="field-label">${label}</span><div class="segmented-control" style="--segments:${options.length}">${options.map(option => `<button type="button" class="${String(option.value) === String(value) ? 'is-active' : ''}" data-set-field="${key}" data-set-value="${escAttr(option.value)}" data-scope="${scope}" title="${escAttr(option.label)}">${option.icon ? `<i class="${option.icon}"></i>` : ''}${option.short ? `<span>${esc(option.short)}</span>` : ''}</button>`).join('')}</div></div>`;
      }

      function choiceGrid(label, key, value, options, scope = 'data', rerender = false) {
        return `<div class="builder-field"><span class="field-label">${label}</span><div class="choice-grid">${options.map(option => `<button type="button" class="${String(option.value) === String(value) ? 'is-active' : ''}" data-set-field="${key}" data-set-value="${escAttr(option.value)}" data-scope="${scope}" ${rerender ? 'data-rerender="true"' : ''}>${option.icon ? `<i class="${option.icon}"></i>` : ''}${esc(option.label)}</button>`).join('')}</div></div>`;
      }

      function iconPicker(key, value) {
        return `<div class="builder-field"><span class="field-label">Ícone do botão</span><div class="icon-picker-grid">${iconChoices.map(icon => `<button type="button" class="${icon === value ? 'is-active' : ''} ${icon === '' ? 'icon-none' : ''}" data-set-field="${key}" data-set-value="${escAttr(icon)}" data-scope="data" aria-label="${icon ? `Usar ${escAttr(icon)}` : 'Sem ícone'}">${icon || '<i class="bi bi-slash-circle"></i><small>Sem</small>'}</button>`).join('')}</div></div>`;
      }

      function colorPicker(label, key, value, scope = 'theme', fallback = '#ffffff', canClear = false, clearLabel = 'Sem cor') {
        const hasColor = /^#[0-9a-f]{6}$/i.test(String(value || ''));
        const current = hasColor ? value : fallback;
        return `<div class="color-picker ${!hasColor && canClear ? 'is-transparent' : ''}" style="--swatch:${escAttr(current)}"><label><input type="color" value="${escAttr(current)}" data-bind="${key}" data-scope="${scope}" aria-label="${escAttr(label)}"><span class="color-picker__swatch"></span><strong>${esc(label)}</strong></label>${canClear ? `<button type="button" class="color-picker__clear" data-clear-field="${key}" data-clear-value="transparent" data-scope="${scope}"><i class="bi bi-slash-circle"></i>${esc(clearLabel)}</button>` : ''}</div>`;
      }

      function assetField(label, key, value, type = 'image', name = '', nameField = '') {
        const isImage = type === 'image' && value;
        return `<div class="builder-field"><span class="field-label">${label}</span><div class="asset-field-card"><span class="asset-field-preview">${isImage ? `<img src="${escAttr(value)}" alt="Prévia">` : `<i class="bi ${type === 'pdf' ? 'bi-file-earmark-pdf' : 'bi-image'}"></i>`}</span><span class="asset-field-copy"><strong>${esc(name || (value ? 'Arquivo selecionado' : 'Nenhum arquivo'))}</strong><small>${type === 'pdf' ? 'PDF ou endereço do documento' : 'JPG, PNG, WEBP ou endereço da imagem'}</small></span><button type="button" data-asset-picker data-asset-field="${key}" data-asset-type="${type}" ${nameField ? `data-asset-name-field="${nameField}"` : ''}>${value ? 'Trocar' : 'Escolher'}</button></div></div>`;
      }

      function anchorOptions(selected = '') {
        const options = [{ value: '', label: 'Escolha um bloco' }].concat(state.elements.map(element => ({ value: elementAnchor(element), label: layerTitle(element) })));
        return selectField('Destino na página', 'anchorTarget', selected, options, { help: 'O botão rola diretamente para o bloco escolhido.' });
      }

      function actionFields(data) {
        const choices = [
          { value: 'external', label: 'Link externo', icon: 'bi bi-box-arrow-up-right' },
          { value: 'anchor', label: 'Parte da página', icon: 'bi bi-signpost-split' },
          { value: 'whatsapp', label: 'WhatsApp', icon: 'bi bi-whatsapp' },
          { value: 'instagram', label: 'Instagram', icon: 'bi bi-instagram' },
          { value: 'document', label: 'Documento / PDF', icon: 'bi bi-file-earmark-pdf' },
          { value: 'menu', label: 'Cardápio PlayMenu', icon: 'bi bi-menu-button-wide' },
          { value: 'reservation', label: 'Reserva interna', icon: 'bi bi-calendar-check' }
        ];
        let fields = choiceGrid('O que este botão faz?', 'actionType', data.actionType || 'external', choices, 'data', true);
        switch (data.actionType) {
          case 'anchor': fields += anchorOptions(data.anchorTarget); break;
          case 'whatsapp': fields += textField('Número com país e DDD', 'whatsappPhone', data.whatsappPhone, { type: 'tel', placeholder: '5585999999999' }) + textareaField('Mensagem pronta', 'whatsappMessage', data.whatsappMessage, { styleable:false }); break;
          case 'instagram': fields += textField('Perfil do Instagram', 'instagramUrl', data.instagramUrl, { type: 'url', placeholder: 'https://instagram.com/seuperfil' }); break;
          case 'document': fields += assetField('Documento', 'documentUrl', data.documentUrl, 'pdf', data.documentName, 'documentName'); break;
          case 'menu': fields += textField('Rota do cardápio', 'platformPath', data.platformPath || '#cardapio', { styleable:false, help: 'Pode ser uma rota da plataforma ou uma âncora da página.' }); break;
          case 'reservation': fields += textField('Rota da reserva', 'platformPath', data.platformPath || '#reservas', { styleable:false, help: 'Pode abrir o agendamento interno do PlayMenu.' }); break;
          default: fields += textField('Link de destino', 'url', data.url, { type: 'url', placeholder: 'https://...' });
        }
        if (!['anchor','menu','reservation','whatsapp'].includes(data.actionType)) fields += switchField('Abrir em uma nova aba', 'newTab', data.newTab !== false);
        return fields;
      }

      function listEditor(kind, rows) {
        const configs = {
          links: { parts: ['Ícone','Nome','Link'], defaults: ['🔗','Novo link','https://'], add: 'Adicionar link', styleable:[false,true,false] },
          menu: { parts: ['Ícone','Categoria','Descrição','Link'], defaults: ['🍽️','Nova categoria','Descrição','#secao'], add: 'Adicionar categoria', styleable:[false,true,true,false] },
          hours: { parts: ['Dia ou período','Horário'], defaults: ['Segunda a sexta','11h às 22h'], add: 'Adicionar horário', styleable:[true,true] }
        };
        const config = configs[kind];
        const baseKey = kind === 'hours' ? 'schedule' : 'items';
        return `<div class="builder-field"><span class="field-label">${kind === 'hours' ? 'Horários' : kind === 'menu' ? 'Itens do cardápio' : 'Links'}</span><div class="repeater-list" data-repeater-kind="${kind}">${rows.map((row,index) => `<div class="design-group repeater-row" data-repeater-index="${index}"><div class="d-flex justify-content-between align-items-center mb-2"><strong class="small">Item ${index + 1}</strong><button class="btn btn-sm btn-outline-danger" type="button" data-repeater-remove="${index}" data-repeater-kind="${kind}"><i class="bi bi-trash3"></i></button></div>${config.parts.map((label,part) => {
          const input = `<input class="form-control" type="text" value="${escAttr(row[part] || '')}" data-repeater-input data-repeater-kind="${kind}" data-repeater-index="${index}" data-repeater-part="${part}">`;
          return config.styleable[part] ? styledFieldMarkup(label, input, `${baseKey}.${index}.${part}`) : `<label class="builder-field"><span>${label}</span>${input}</label>`;
        }).join('')}</div>`).join('')}</div><button class="btn btn-outline-primary w-100" type="button" data-repeater-add="${kind}"><i class="bi bi-plus-lg me-1"></i>${config.add}</button></div>`;
      }

      function galleryEditor(data) {
        const images = parseLines(data.images, 12);
        return `${textField('Título', 'title', data.title)}${segmentedControl('Colunas', 'columns', String(data.columns), [{ value: '2', label: '2 colunas', short: '2' },{ value: '3', label: '3 colunas', short: '3' }], 'data')}<div class="builder-field"><span class="field-label">Fotos da galeria</span><div class="gallery-editor-grid">${images.map((image,index) => `<div class="gallery-editor-item"><img src="${escAttr(image)}" alt="Foto ${index + 1}"><button type="button" data-gallery-remove="${index}" aria-label="Remover foto"><i class="bi bi-x-lg"></i></button><button type="button" data-gallery-change="${index}" aria-label="Trocar foto"><i class="bi bi-pencil"></i></button></div>`).join('')}<button class="gallery-editor-add" type="button" data-gallery-add><i class="bi bi-plus-lg"></i><span>Adicionar foto</span></button></div></div>`;
      }

      function paymentEditor(data) {
        const selected = new Set(parseLines(data.methods));
        return `${textField('Título', 'title', data.title)}<div class="builder-field"><span class="field-label">Formas aceitas</span><div class="choice-grid">${paymentChoices.map(method => `<button type="button" class="${selected.has(method) ? 'is-active' : ''}" data-payment-choice="${escAttr(method)}"><i class="bi bi-credit-card"></i>${esc(method)}</button>`).join('')}</div></div>`;
      }

      function contentFields(element) {
        const data = element.data;
        switch (element.type) {
          case 'profile': return textField('Nome do estabelecimento','businessName',data.businessName) + textField('Categoria e cidade','category',data.category) + textareaField('Descrição curta','bio',data.bio,{ help:'Use até três linhas para facilitar a leitura.' }) + assetField('Logo ou foto do perfil','avatar',data.avatar,'image') + assetField('Imagem de capa','cover',data.cover,'image') + switchField('Mostrar status de atendimento','showStatus',data.showStatus) + (data.showStatus ? textField('Texto do status','statusText',data.statusText) : '');
          case 'button': return textField('Texto do botão','label',data.label) + textField('Descrição opcional','subtitle',data.subtitle) + iconPicker('icon',data.icon) + (data.icon ? segmentedControl('Posição do ícone','iconPosition',data.iconPosition || 'left',[{value:'left',label:'Esquerda',icon:'bi bi-arrow-left'},{value:'center',label:'Centro',icon:'bi bi-arrows-collapse-vertical'},{value:'right',label:'Direita',icon:'bi bi-arrow-right'}],'data') : '') + actionFields(data);
          case 'linksGrid': return listEditor('links', parsePipes(data.items,3));
          case 'heading': return textField('Título','text',data.text) + textField('Subtítulo','subtitle',data.subtitle);
          case 'text': return textareaField('Texto','text',data.text);
          case 'menu': return textField('Título','title',data.title) + textField('Subtítulo','subtitle',data.subtitle) + listEditor('menu',parsePipes(data.items,4));
          case 'product': return assetField('Imagem do produto','image',data.image,'image') + textField('Nome do produto','title',data.title) + textareaField('Descrição','description',data.description) + textField('Preço atual','price',data.price) + textField('Preço anterior','oldPrice',data.oldPrice) + textField('Selo','badge',data.badge) + textField('Texto do botão','buttonLabel',data.buttonLabel) + textField('Link do pedido','url',data.url,{ type:'url' });
          case 'promo': return textField('Chamada superior','eyebrow',data.eyebrow) + textField('Título da promoção','title',data.title) + textareaField('Descrição','text',data.text) + textField('Código do cupom','code',data.code) + textField('Texto do link','linkLabel',data.linkLabel) + textField('Link','url',data.url,{ type:'url' });
          case 'whatsapp': return textField('Texto principal','label',data.label) + textField('Descrição','subtitle',data.subtitle) + iconPicker('icon',data.icon) + (data.icon ? segmentedControl('Posição do ícone','iconPosition',data.iconPosition || 'left',[{value:'left',label:'Esquerda',icon:'bi bi-arrow-left'},{value:'center',label:'Centro',icon:'bi bi-arrows-collapse-vertical'},{value:'right',label:'Direita',icon:'bi bi-arrow-right'}],'data') : '') + textField('Número com país e DDD','phone',data.phone,{ type:'tel', placeholder:'5585999999999' }) + textareaField('Mensagem automática','message',data.message,{ styleable:false });
          case 'delivery': return textField('Título','title',data.title) + textField('Subtítulo','subtitle',data.subtitle) + textField('Link do iFood','ifood',data.ifood,{ type:'url' }) + textField('Link da Rappi','rappi',data.rappi,{ type:'url' }) + textField('Pedido direto ou WhatsApp','own',data.own,{ type:'url' });
          case 'reservation': return textField('Título','title',data.title) + textField('Descrição','text',data.text) + textField('Texto do botão','label',data.label) + textField('Link da reserva','url',data.url,{ type:'url' });
          case 'gallery': return galleryEditor(data);
          case 'video': return assetField('Imagem de capa','cover',data.cover,'image') + textField('Título','title',data.title) + textField('Subtítulo','subtitle',data.subtitle) + textField('Link do vídeo ou Reel','url',data.url,{ type:'url' });
          case 'location': return textField('Título','title',data.title) + textareaField('Endereço','address',data.address) + textField('Referência','reference',data.reference) + textField('Link do Google Maps','url',data.url,{ type:'url' });
          case 'hours': return textField('Título','title',data.title) + listEditor('hours',parsePipes(data.schedule,2));
          case 'social': return textField('Instagram','instagram',data.instagram,{ type:'url' }) + textField('TikTok','tiktok',data.tiktok,{ type:'url' }) + textField('Facebook','facebook',data.facebook,{ type:'url' }) + textField('YouTube','youtube',data.youtube,{ type:'url' }) + textField('Site','website',data.website,{ type:'url' });
          case 'testimonial': return textareaField('Depoimento','quote',data.quote) + textField('Nome do cliente','name',data.name) + textField('Identificação','role',data.role) + segmentedControl('Nota','rating',String(data.rating),[1,2,3,4,5].map(value => ({ value:String(value), label:`${value} estrelas`, short:String(value) })),'data');
          case 'wifi': return textField('Título','title',data.title) + textField('Texto de apoio','text',data.text) + textField('Nome da rede','network',data.network) + textField('Senha','password',data.password);
          case 'payments': return paymentEditor(data);
          case 'banner': return assetField('Imagem do banner','image',data.image,'image') + textField('Título','title',data.title) + textField('Subtítulo','subtitle',data.subtitle) + textField('Link ao tocar','url',data.url,{ type:'url' });
          case 'event': return assetField('Imagem do evento','image',data.image,'image') + textField('Data e horário','date',data.date) + textField('Título','title',data.title) + textareaField('Descrição','description',data.description) + textField('Texto do botão','buttonLabel',data.buttonLabel) + textField('Link de inscrição ou reserva','url',data.url,{ type:'url' });
          case 'file': return textField('Título do documento','title',data.title) + textField('Descrição','description',data.description) + assetField('Arquivo PDF','fileUrl',data.fileUrl,'pdf',data.fileName,'fileName');
          case 'spacer': return rangeControl('Altura do espaço','height',data.height,8,100,'px','data');
          case 'footer': return textField('Texto do rodapé','text',data.text) + switchField('Mostrar “Feito com PlayMenu Bio”','showPowered',data.showPowered);
          case 'divider': return '<div class="builder-help-card"><i class="bi bi-info-circle"></i><p>Este bloco cria uma linha de separação. Use a aba Estilo para alterar cor, espessura e margens.</p></div>';
          default: return '';
        }
      }

      function styleFields(element) {
        const style = element.style || {};
        const radius = style.borderRadius === '' ? state.theme.cardRadius : style.borderRadius;
        const padding = style.padding === '' ? 14 : style.padding;
        return `<div class="design-group"><h3>Fundo e borda do bloco</h3><p class="design-group__help">As cores e a tipografia dos textos são configuradas individualmente ao lado de cada campo na aba Conteúdo.</p><div class="color-picker-row color-picker-row--two">${colorPicker('Fundo','background',style.background,'style','#ffffff',true,'Sem fundo')}${colorPicker('Borda','borderColor',style.borderColor,'style','#dedede',true,'Sem borda')}</div><button class="btn btn-sm btn-outline-secondary w-100 mt-2" type="button" data-reset-block-colors><i class="bi bi-arrow-counterclockwise me-1"></i>Usar fundo e borda padrão</button></div><div class="design-group"><h3>Formato do bloco</h3>${segmentedControl('Alinhamento do conteúdo','align',style.align || '',[{ value:'left',label:'Esquerda',icon:'bi bi-text-left' },{ value:'center',label:'Centro',icon:'bi bi-text-center' },{ value:'right',label:'Direita',icon:'bi bi-text-right' }],'style')}${rangeControl('Arredondamento','borderRadius',radius,0,40,'px','style')}${rangeControl('Espaçamento interno','padding',padding,0,36,'px','style')}${choiceGrid('Sombra','shadow',style.shadow || '',[{ value:'',label:'Padrão',icon:'bi bi-layers' },{ value:'none',label:'Sem sombra',icon:'bi bi-square' },{ value:'soft',label:'Suave',icon:'bi bi-square-half' },{ value:'strong',label:'Forte',icon:'bi bi-stack' }],'style')}</div>`;
      }

      function advancedFields(element) {
        return `<div class="design-group"><h3>Espaçamento e âncora</h3>${rangeControl('Margem superior','marginTop',element.style.marginTop || 0,0,80,'px','style')}${rangeControl('Margem inferior','marginBottom',element.style.marginBottom || 0,0,80,'px','style')}${textField('Identificador da seção','@customId',element.customId,{ scope:'element', styleable:false, placeholder:'exemplo: cardapio', help:'Use este nome para criar botões que levam até este bloco.' })}</div>${switchField('Ocultar este bloco','@hidden',element.hidden,'element')}<div class="action-grid"><button class="btn btn-outline-secondary" type="button" data-inspector-action="duplicate"><i class="bi bi-copy me-1"></i>Duplicar</button><button class="btn btn-danger" type="button" data-inspector-action="delete"><i class="bi bi-trash3 me-1"></i>Excluir</button></div>`;
      }

      function renderInspector() {
        const element = getSelected();
        document.querySelectorAll('[data-inspector-tab]').forEach(button => button.classList.toggle('is-active', button.dataset.inspectorTab === state.inspectorTab));
        if (!element) {
          refs.inspectorTitle.textContent = 'Selecione um bloco';
          refs.inspectorSubtitle.textContent = 'Editor do bloco';
          refs.inspectorBody.innerHTML = '<div class="empty-panel"><div><i class="bi bi-hand-index-thumb"></i><strong>Toque em um bloco da página</strong><small>O editor será aberto com opções simples de conteúdo, estilo e posição.</small></div></div>';
          return;
        }
        refs.inspectorTitle.textContent = layerTitle(element);
        refs.inspectorSubtitle.textContent = nameFor(element.type);
        refs.inspectorBody.innerHTML = state.inspectorTab === 'content' ? contentFields(element) : state.inspectorTab === 'style' ? styleFields(element) : advancedFields(element);
        bindPanelFields(refs.inspectorBody, element);
      }

      function setBoundValue(element, scope, key, value) {
        if (scope === 'theme') state.theme[key] = value;
        else if (scope === 'style') element.style[key] = value;
        else if (scope === 'element') {
          if (key.startsWith('@')) element[key.slice(1)] = value;
          else element[key] = value;
        } else element.data[key] = value;
      }

      function bindPanelFields(root, element) {
        root.querySelectorAll('[data-bind]').forEach(input => {
          const eventName = input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'input';
          input.addEventListener(eventName, () => {
            let value = input.type === 'checkbox' ? input.checked : input.value;
            if (input.type === 'range') value = Number(value);
            setBoundValue(element, input.dataset.scope || 'data', input.dataset.bind, value);
            const output = root.querySelector(`[data-range-output="${input.dataset.scope || 'data'}:${input.dataset.bind}"]`);
            if (output) output.textContent = `${value}${input.dataset.suffix || ''}`;
            const picker = input.closest('.color-picker');
            if (picker && input.type === 'color') {
              picker.classList.remove('is-transparent');
              picker.style.setProperty('--swatch', value);
            }
            renderCanvas();
            renderLayers();
            renderInsertPositions();
            scheduleCommit();
            if (input.dataset.rerender === 'true') renderInspector();
          });
        });
        root.querySelectorAll('[data-set-field]').forEach(button => button.onclick = () => {
          let value = button.dataset.setValue;
          if (['columns','rating'].includes(button.dataset.setField)) value = Number(value);
          setBoundValue(element, button.dataset.scope || 'data', button.dataset.setField, value);
          renderCanvas();
          scheduleCommit();
          button.closest('.segmented-control, .choice-grid, .icon-picker-grid')?.querySelectorAll('button').forEach(item => item.classList.toggle('is-active', item === button));
          if (button.dataset.rerender === 'true') renderInspector();
        });
        root.querySelectorAll('[data-clear-field]').forEach(button => button.onclick = () => {
          setBoundValue(element, button.dataset.scope || 'style', button.dataset.clearField, button.dataset.clearValue ?? '');
          commit();
          renderCanvas();
          renderInspector();
        });
        root.querySelectorAll('[data-toggle-text-style]').forEach(button => button.onclick = event => {
          event.preventDefault();
          const panel = root.querySelector(`[data-text-style-panel="${CSS.escape(button.dataset.toggleTextStyle)}"]`);
          if (!panel) return;
          const open = panel.hidden;
          root.querySelectorAll('[data-text-style-panel]').forEach(item => { item.hidden = true; });
          panel.hidden = !open;
        });
        root.querySelectorAll('[data-text-color]').forEach(input => input.addEventListener('change', () => {
          element.textStyles = element.textStyles || {};
          element.textStyles[input.dataset.textColor] = { ...(element.textStyles[input.dataset.textColor] || {}), color:input.value };
          input.closest('.field-color-control')?.classList.remove('is-inherit');
          input.closest('.field-color-control')?.style.setProperty('--field-color', input.value);
          renderCanvas();
          scheduleCommit();
        }));
        root.querySelectorAll('[data-clear-text-color]').forEach(button => button.onclick = event => {
          event.preventDefault();
          const key = button.dataset.clearTextColor;
          element.textStyles = element.textStyles || {};
          element.textStyles[key] = { ...(element.textStyles[key] || {}), color:'' };
          commit();
          renderCanvas();
          renderInspector();
        });
        root.querySelectorAll('[data-text-style-key]').forEach(button => button.onclick = event => {
          event.preventDefault();
          const key = button.dataset.textStyleKey;
          const prop = button.dataset.textStyleProp;
          element.textStyles = element.textStyles || {};
          element.textStyles[key] = { ...(element.textStyles[key] || {}), [prop]:button.dataset.textStyleValue };
          renderCanvas();
          scheduleCommit();
          button.closest('.segmented-control, .text-style-fonts')?.querySelectorAll('button').forEach(item => item.classList.toggle('is-active', item === button));
        });
        root.querySelectorAll('[data-reset-text-style]').forEach(button => button.onclick = event => {
          event.preventDefault();
          element.textStyles = element.textStyles || {};
          delete element.textStyles[button.dataset.resetTextStyle];
          commit();
          renderCanvas();
          renderInspector();
        });
        root.querySelectorAll('[data-asset-picker]').forEach(button => button.onclick = () => openAssetPicker({ scope:'element', field:button.dataset.assetField, type:button.dataset.assetType, nameField:button.dataset.assetNameField || '', value:element.data[button.dataset.assetField] || '', name:button.dataset.assetNameField ? element.data[button.dataset.assetNameField] : '' }));
        root.querySelectorAll('[data-inspector-action]').forEach(button => button.onclick = () => button.dataset.inspectorAction === 'duplicate' ? duplicateSelected() : askDelete(element.id));
        root.querySelector('[data-reset-block-colors]')?.addEventListener('click', () => { element.style.background = ''; element.style.borderColor = ''; commit(); renderCanvas(); renderInspector(); });
        bindRepeaters(root, element);
        bindGalleryEditor(root, element);
        root.querySelectorAll('[data-payment-choice]').forEach(button => button.onclick = () => {
          const selected = new Set(parseLines(element.data.methods));
          const method = button.dataset.paymentChoice;
          selected.has(method) ? selected.delete(method) : selected.add(method);
          element.data.methods = [...selected].join('\n');
          button.classList.toggle('is-active', selected.has(method));
          renderCanvas();
          scheduleCommit();
        });
      }

      function bindRepeaters(root, element) {
        root.querySelectorAll('[data-repeater-input]').forEach(input => input.oninput = () => {
          const kind = input.dataset.repeaterKind;
          const expected = kind === 'menu' ? 4 : kind === 'links' ? 3 : 2;
          const field = kind === 'menu' ? 'items' : kind === 'links' ? 'items' : 'schedule';
          const rows = parsePipes(element.data[field], expected);
          const index = Number(input.dataset.repeaterIndex);
          const part = Number(input.dataset.repeaterPart);
          if (!rows[index]) rows[index] = Array(expected).fill('');
          rows[index][part] = input.value;
          element.data[field] = pipesToString(rows);
          renderCanvas();
          scheduleCommit();
        });
        root.querySelectorAll('[data-repeater-add]').forEach(button => button.onclick = () => {
          const kind = button.dataset.repeaterAdd;
          const config = kind === 'menu' ? { field:'items', expected:4, row:['🍽️','Nova categoria','Descrição','#secao'] } : kind === 'links' ? { field:'items', expected:3, row:['🔗','Novo link','https://'] } : { field:'schedule', expected:2, row:['Novo período','11h às 22h'] };
          const rows = parsePipes(element.data[config.field], config.expected);
          rows.push(config.row);
          element.data[config.field] = pipesToString(rows);
          commit();
          renderInspector();
          renderCanvas();
        });
        root.querySelectorAll('[data-repeater-remove]').forEach(button => button.onclick = () => {
          const kind = button.dataset.repeaterKind;
          const config = kind === 'menu' ? { field:'items', expected:4 } : kind === 'links' ? { field:'items', expected:3 } : { field:'schedule', expected:2 };
          const rows = parsePipes(element.data[config.field], config.expected);
          rows.splice(Number(button.dataset.repeaterRemove), 1);
          element.data[config.field] = pipesToString(rows);
          commit();
          renderInspector();
          renderCanvas();
        });
      }

      function bindGalleryEditor(root, element) {
        root.querySelector('[data-gallery-add]')?.addEventListener('click', () => openAssetPicker({ scope:'gallery', mode:'add', type:'image', value:'' }));
        root.querySelectorAll('[data-gallery-change]').forEach(button => button.onclick = () => {
          const images = parseLines(element.data.images, 12);
          const index = Number(button.dataset.galleryChange);
          openAssetPicker({ scope:'gallery', mode:'replace', index, type:'image', value:images[index] || '' });
        });
        root.querySelectorAll('[data-gallery-remove]').forEach(button => button.onclick = () => {
          const images = parseLines(element.data.images, 12);
          images.splice(Number(button.dataset.galleryRemove), 1);
          element.data.images = images.join('\n');
          commit();
          renderCanvas();
          renderInspector();
        });
      }

      function renderDesignPanel() {
        const theme = state.theme;
        if (!theme.backgroundMode) theme.backgroundMode = theme.backgroundImage ? 'image' : 'color';
        refs.designPanel.innerHTML = `<div class="design-group"><h3>Fundo da página</h3>${segmentedControl('Tipo de fundo','backgroundMode',theme.backgroundMode,[{value:'color',label:'Cor',icon:'bi bi-palette-fill'},{value:'image',label:'Imagem',icon:'bi bi-image'}],'theme')}
          ${theme.backgroundMode === 'color'
            ? `<div class="background-mode-panel"><p class="design-group__help">A cor será usada em todo o fundo. A imagem fica desativada para evitar conflito.</p><div class="color-picker-row color-picker-row--one">${colorPicker('Cor do fundo','background',theme.background,'theme','#ffffff')}</div></div>`
            : `<div class="background-mode-panel"><div class="background-preview" style="--preview-bg:${escAttr(theme.background)};--preview-image:${theme.backgroundImage ? `url('${escAttr(theme.backgroundImage)}')` : 'none'};--preview-position:${escAttr(theme.backgroundPosition || 'center top')}"></div><div class="action-grid"><button class="btn btn-outline-primary" type="button" data-theme-background-image><i class="bi bi-image me-1"></i>${theme.backgroundImage ? 'Trocar imagem' : 'Escolher imagem'}</button><button class="btn btn-outline-secondary" type="button" data-remove-background-image ${theme.backgroundImage ? '' : 'disabled'}><i class="bi bi-trash3 me-1"></i>Remover</button></div>${segmentedControl('Posição da imagem','backgroundPosition',theme.backgroundPosition || 'center top',[{value:'center top',label:'Topo',icon:'bi bi-align-top'},{value:'center center',label:'Centro',icon:'bi bi-align-center'},{value:'center bottom',label:'Base',icon:'bi bi-align-bottom'}],'theme')}<p class="design-group__help">A imagem usa o modo “cobrir”, preenchendo todo o fundo sem deformar.</p></div>`}</div>
          <div class="design-group"><h3>Formato geral</h3>${rangeControl('Arredondamento dos cards','cardRadius',theme.cardRadius,4,36,'px','theme')}${rangeControl('Espaço entre blocos','blockGap',theme.blockGap,4,30,'px','theme')}${rangeControl('Margem lateral','horizontalPadding',theme.horizontalPadding,10,30,'px','theme')}${choiceGrid('Estilo dos botões','buttonStyle',theme.buttonStyle,[{value:'filled',label:'Preenchido',icon:'bi bi-square-fill'},{value:'outline',label:'Contorno',icon:'bi bi-square'},{value:'soft',label:'Suave',icon:'bi bi-square-half'}],'theme')}${choiceGrid('Sombra dos cards','shadow',theme.shadow,[{value:'none',label:'Sem sombra',icon:'bi bi-square'},{value:'soft',label:'Suave',icon:'bi bi-square-half'},{value:'strong',label:'Forte',icon:'bi bi-stack'}],'theme')}${segmentedControl('Formato das redes','socialStyle',theme.socialStyle,[{value:'circle',label:'Circular',icon:'bi bi-circle'},{value:'rounded',label:'Arredondado',icon:'bi bi-app'},{value:'square',label:'Quadrado',icon:'bi bi-square'}],'theme')}</div>`;
        bindDesignFields();
      }

      function bindDesignFields() {
        refs.designPanel.querySelectorAll('[data-bind]').forEach(input => {
          const eventName = input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'input';
          input.addEventListener(eventName, () => {
            let value = input.type === 'checkbox' ? input.checked : input.value;
            if (input.type === 'range') value = Number(value);
            state.theme[input.dataset.bind] = value;
            if (input.dataset.bind === 'background') state.theme.backgroundMode = 'color';
            const output = refs.designPanel.querySelector(`[data-range-output="theme:${input.dataset.bind}"]`);
            if (output) output.textContent = `${value}${input.dataset.suffix || ''}`;
            const picker = input.closest('.color-picker');
            if (picker && input.type === 'color') picker.style.setProperty('--swatch', value);
            renderCanvas();
            scheduleCommit();
          });
        });
        refs.designPanel.querySelectorAll('[data-set-field]').forEach(button => button.onclick = () => {
          state.theme[button.dataset.setField] = button.dataset.setValue;
          if (button.dataset.setField === 'backgroundMode') {
            commit();
            renderCanvas();
            renderDesignPanel();
            return;
          }
          button.closest('.segmented-control, .choice-grid')?.querySelectorAll('button').forEach(item => item.classList.toggle('is-active', item === button));
          renderCanvas();
          scheduleCommit();
        });
        refs.designPanel.querySelector('[data-theme-background-image]')?.addEventListener('click', () => openAssetPicker({ scope:'theme', field:'backgroundImage', type:'image', value:state.theme.backgroundImage || '' }));
        refs.designPanel.querySelector('[data-remove-background-image]')?.addEventListener('click', () => {
          state.theme.backgroundImage = '';
          state.theme.backgroundMode = 'color';
          commit();
          renderCanvas();
          renderDesignPanel();
        });
      }

      function openAssetPicker(target) {
        assetTarget = target;
        pendingAssetValue = target.value || '';
        pendingAssetName = target.name || '';
        const isPdf = target.type === 'pdf';
        $('#assetModalTitle').textContent = isPdf ? 'Selecionar documento' : 'Selecionar imagem';
        $('#assetModalDescription').textContent = isPdf ? 'Envie um PDF ou informe o endereço do documento.' : 'Envie uma imagem ou informe o endereço dela.';
        $('#assetFileHelp').textContent = isPdf ? 'Arquivo PDF de até 2 MB' : 'JPG, PNG, WEBP ou GIF de até 5 MB (otimizado automaticamente)';
        refs.assetFileInput.accept = isPdf ? 'application/pdf' : 'image/jpeg,image/png,image/webp,image/gif';
        refs.assetFileInput.value = '';
        refs.assetUrlInput.value = /^data:/.test(pendingAssetValue) ? '' : pendingAssetValue;
        updateAssetPreview();
        window.bootstrap?.Modal.getOrCreateInstance($('#assetModal')).show();
      }

      function updateAssetPreview() {
        if (!pendingAssetValue) {
          refs.assetPreview.innerHTML = '<div><i class="bi bi-cloud-arrow-up"></i><span>Nenhum arquivo selecionado</span></div>';
          return;
        }
        if (assetTarget?.type === 'pdf') {
          refs.assetPreview.innerHTML = `<div><i class="bi bi-file-earmark-pdf asset-file-icon"></i><span>${esc(pendingAssetName || 'Documento PDF selecionado')}</span></div>`;
        } else {
          refs.assetPreview.innerHTML = `<img src="${escAttr(pendingAssetValue)}" alt="Prévia do arquivo">`;
        }
      }

      async function readFile(file) {
        if (!file.type.startsWith('image/')) {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }
        const raw = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        return new Promise(resolve => {
          const image = new Image();
          image.onload = () => {
            const maxSide = 1600;
            const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(image.width * scale));
            canvas.height = Math.max(1, Math.round(image.height * scale));
            canvas.getContext('2d', { alpha:true }).drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/webp', .82));
          };
          image.onerror = () => resolve(raw);
          image.src = raw;
        });
      }

      async function handleAssetFile(file) {
        if (!file) return;
        const isPdf = assetTarget?.type === 'pdf';
        const maxSize = isPdf ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
        if (file.size > maxSize) return toast(`Escolha um arquivo de até ${isPdf ? 2 : 5} MB.`, 'error');
        if (isPdf && file.type !== 'application/pdf') return toast('Escolha um arquivo PDF.', 'error');
        if (!isPdf && !file.type.startsWith('image/')) return toast('Escolha uma imagem válida.', 'error');
        try {
          const form = new FormData();
          form.append('asset', file);
          const response = await fetch(apiUrl('/api/restaurant/bio-assets'), { method:'POST', headers:authHeaders(), body:form });
          if (!response.ok) throw new Error((await response.json().catch(() => ({}))).detail || 'Falha no upload.');
          const uploaded = await response.json();
          pendingAssetValue = `${API_BASE}${uploaded.url}`;
          pendingAssetName = uploaded.name || file.name;
          refs.assetUrlInput.value = '';
          updateAssetPreview();
          toast('Arquivo enviado com sucesso.', 'success');
        } catch (error) {
          toast(error.message || 'Não foi possível enviar o arquivo.', 'error');
        }
      }

      function applyAsset() {
        const value = pendingAssetValue || refs.assetUrlInput.value.trim();
        if (!value) return toast('Escolha um arquivo ou informe um endereço.', 'error');
        const element = getSelected();
        if (assetTarget.scope === 'theme') {
          state.theme[assetTarget.field] = value;
          if (assetTarget.field === 'backgroundImage') state.theme.backgroundMode = 'image';
        } else if (assetTarget.scope === 'gallery' && element) {
          const images = parseLines(element.data.images, 12);
          if (assetTarget.mode === 'add') images.push(value);
          else images[assetTarget.index] = value;
          element.data.images = images.slice(0,12).join('\n');
        } else if (assetTarget.scope === 'element' && element) {
          element.data[assetTarget.field] = value;
          if (assetTarget.nameField && pendingAssetName) element.data[assetTarget.nameField] = pendingAssetName;
        }
        commit();
        renderAll(false);
        window.bootstrap?.Modal.getOrCreateInstance($('#assetModal')).hide();
        toast('Arquivo aplicado.', 'success');
      }

      function snapshot() {
        return clone({ projectId:state.projectId, projectName:state.projectName, theme:state.theme, elements:state.elements, selectedId:state.selectedId });
      }
      function commit() {
        clearTimeout(recordTimer);
        const current = snapshot();
        const previous = history[historyIndex];
        if (previous && JSON.stringify(previous) === JSON.stringify(current)) return;
        history = history.slice(0, historyIndex + 1);
        history.push(current);
        if (history.length > 80) history.shift();
        historyIndex = history.length - 1;
        updateHistoryButtons();
      }
      function scheduleCommit() { clearTimeout(recordTimer); recordTimer = setTimeout(commit, 420); }
      function applySnapshot(value) { state = { ...state, ...clone(value), inspectorTab:state.inspectorTab || 'content' }; renderAll(false); }
      function undo() { if (historyIndex <= 0) return; historyIndex -= 1; applySnapshot(history[historyIndex]); }
      function redo() { if (historyIndex >= history.length - 1) return; historyIndex += 1; applySnapshot(history[historyIndex]); }
      function updateHistoryButtons() { $('#undoBtn').disabled = historyIndex <= 0; $('#redoBtn').disabled = historyIndex >= history.length - 1; }

      function hydrateProject(project) {
        const next = clone(project);
        next.theme = { ...clone(baseTheme), ...(next.theme || {}) };
        if (!next.theme.backgroundMode) next.theme.backgroundMode = next.theme.backgroundImage ? 'image' : 'color';
        next.elements = (next.elements || []).map(element => {
          const typeDefaults = defaults[element.type] ? defaults[element.type]() : {};
          return {
            id:element.id || uid(),
            type:element.type,
            hidden:Boolean(element.hidden),
            data:{ ...typeDefaults, ...(element.data || {}) },
            style:{ ...styleDefaults(), ...(element.style || {}) },
            textStyles:{ ...(element.textStyles || {}) },
            customId:element.customId || '',
            customClass:element.customClass || ''
          };
        });
        next.selectedId = null;
        next.inspectorTab = 'content';
        return next;
      }

      function getProjects() {
        return clone(remoteProjects);
      }
      async function refreshProjects() {
        try {
          const response = await fetch(apiUrl('/api/restaurant/bio-pages'), { headers:authHeaders() });
          if (!response.ok) throw new Error('Não foi possível carregar suas páginas.');
          remoteProjects = await response.json();
          renderProjectList();
        } catch (error) {
          toast(error.message, 'error');
        }
      }
      async function persistProject(published = null) {
        state.projectName = refs.projectName.value.trim() || 'Página sem título';
        const payload = { ...snapshot(), updatedAt:new Date().toISOString() };
        try {
          const response = await fetch(apiUrl('/api/restaurant/bio-pages'), {
            method:'POST', headers:authHeaders({'Content-Type':'application/json'}),
            body:JSON.stringify({ project_id:state.projectId, project_name:state.projectName, state:payload, html:generatePreviewDocument(), ...(published === null ? {} : {published}) })
          });
          if (!response.ok) throw new Error((await response.json().catch(() => ({}))).detail || 'Não foi possível salvar.');
          const saved = await response.json();
          payload.slug = saved.slug;
          payload.published = saved.published;
          payload.publicUrl = saved.public_url;
          const index = remoteProjects.findIndex(project => project.projectId === state.projectId);
          if (index >= 0) remoteProjects[index] = payload; else remoteProjects.unshift(payload);
          commit();
          renderProjectList();
          toast(published ? 'Página publicada com sucesso.' : 'Página salva na sua conta.', 'success');
          if (published && saved.public_url) window.open(saved.public_url, '_blank', 'noopener');
        } catch (error) {
          toast(error.message || 'Não foi possível salvar a página.', 'error');
        }
      }
      function saveProject() { return persistProject(null); }
      function publishProject() { return persistProject(true); }
      function renderProjectList() {
        const projects = getProjects();
        refs.projectList.innerHTML = projects.length
          ? projects.map(project => `<div class="project-row"><div><strong>${esc(project.projectName || 'Página sem título')}</strong><small>Atualizado em ${new Date(project.updatedAt).toLocaleString('pt-BR')}</small></div><button class="btn btn-outline-primary" type="button" data-load-project="${project.projectId}">Abrir</button><button class="btn btn-outline-danger" type="button" data-delete-project="${project.projectId}" aria-label="Excluir"><i class="bi bi-trash3"></i></button></div>`).join('')
          : '<div class="empty-panel"><div><i class="bi bi-folder2-open"></i><strong>Nenhuma página salva</strong><small>Toque em Salvar para guardar a página atual.</small></div></div>';
        refs.projectList.querySelectorAll('[data-load-project]').forEach(button => button.onclick = () => {
          const project = getProjects().find(item => item.projectId === button.dataset.loadProject);
          if (!project) return;
          state = hydrateProject(project);
          history = [];
          historyIndex = -1;
          commit();
          renderAll(false);
          closeSheet();
          refs.phoneScreen.scrollTop = 0;
          toast('Projeto aberto.', 'success');
        });
        refs.projectList.querySelectorAll('[data-delete-project]').forEach(button => button.onclick = () => openConfirm('Excluir projeto','Deseja remover esta página da sua conta?',async() => {
          try {
            const response = await fetch(apiUrl(`/api/restaurant/bio-pages/${encodeURIComponent(button.dataset.deleteProject)}`), {method:'DELETE',headers:authHeaders()});
            if (!response.ok) throw new Error('Não foi possível excluir.');
            remoteProjects = remoteProjects.filter(project => project.projectId !== button.dataset.deleteProject);
            renderProjectList();
            toast('Projeto removido.', 'success');
          } catch (error) { toast(error.message, 'error'); }
        }));
      }

      function createNew() {
        openConfirm('Criar nova página','A página atual será substituída. Salve antes caso queira preservá-la.',() => {
          state = { projectId:uid(), projectName:'Nova página', theme:clone(baseTheme), elements:[], selectedId:null, inspectorTab:'content' };
          history = [];
          historyIndex = -1;
          commit();
          renderAll(false);
          closeSheet();
          setTimeout(() => openSheet('modelsSheet'), 180);
        });
      }

      function generatePreviewDocument() {
        const visible = state.elements.filter(element => !element.hidden).map(renderElement).join('\n');
        const base = `${location.origin}/bio-builder/`;
        return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(state.theme.seoTitle || state.projectName)}</title><meta name="description" content="${escAttr(state.theme.seoDescription || '')}"><base href="${escAttr(base)}"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700&family=Poppins:wght@400;500;600;700;800&family=Roboto:wght@400;500;700;900&display=swap" rel="stylesheet"><link href="css/builder-mobile.css" rel="stylesheet"><style>*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#111}body{font-family:${esc(state.theme.font)},sans-serif}@media(max-width:430px){html,body{background:var(--page-bg,#fff)}.mobile-page-shell{box-shadow:none}}</style></head><body><main class="mobile-page-shell"><div class="bio-page" style="${pageVars()}">${visible}</div></main></body></html>`;
      }
      function previewPage() {
        const preview = window.open('', '_blank');
        if (!preview) return toast('Permita pop-ups para visualizar a página.', 'error');
        preview.document.open();
        preview.document.write(generatePreviewDocument());
        preview.document.close();
      }

      function positionDesktopSheet(sheet, opener) {
        if (window.innerWidth < 900) return;
        const dock = document.querySelector('.builder-bottom-dock');
        const dockRect = dock?.getBoundingClientRect();
        const openerRect = opener?.getBoundingClientRect() || dockRect;
        const panelHeight = Math.min(780, window.innerHeight - 24);
        const center = openerRect ? openerRect.top + openerRect.height / 2 : window.innerHeight / 2;
        const top = Math.max(12, Math.min(window.innerHeight - panelHeight - 12, center - panelHeight / 2));
        sheet.style.setProperty('--desktop-sheet-top', `${top}px`);
        sheet.style.setProperty('--desktop-sheet-left', `${Math.round((dockRect?.right || 110) + 12)}px`);
      }

      function openSheet(id, opener = null) {
        const sheet = document.getElementById(id);
        if (!sheet) return;
        if (id === 'editSheet' && !getSelected()) return toast('Toque primeiro em um bloco da página.', 'error');
        if (activeSheet && activeSheet !== sheet) {
          activeSheet.classList.remove('is-open');
          activeSheet.setAttribute('aria-hidden','true');
        }
        if (id === 'addSheet') { renderInsertPositions(); renderPalette(refs.componentSearch.value || ''); }
        if (id === 'organizeSheet') renderLayers();
        if (id === 'appearanceSheet') renderDesignPanel();
        if (id === 'modelsSheet') renderPresets();
        if (id === 'projectsSheet') renderProjectList();
        if (id === 'editSheet') renderInspector();
        activeSheet = sheet;
        document.querySelectorAll('.builder-bottom-dock [data-open-sheet]').forEach(button => button.classList.toggle('is-active', button === opener));
        positionDesktopSheet(sheet, opener);
        sheet.classList.add('is-open');
        sheet.setAttribute('aria-hidden','false');
        if (window.innerWidth < 900) {
          refs.sheetBackdrop.hidden = false;
          requestAnimationFrame(() => refs.sheetBackdrop.classList.add('is-visible'));
          document.body.classList.add('sheet-open');
        } else {
          refs.sheetBackdrop.hidden = true;
          refs.sheetBackdrop.classList.remove('is-visible');
          document.body.classList.remove('sheet-open');
        }
        sheet.querySelector('[data-close-sheet]')?.focus({ preventScroll:true });
      }

      function closeSheet() {
        if (!activeSheet) return;
        activeSheet.classList.remove('is-open','is-drag-source-collapsed');
        activeSheet.setAttribute('aria-hidden','true');
        activeSheet.style.removeProperty('transform');
        activeSheet.style.removeProperty('--desktop-sheet-top');
        activeSheet.style.removeProperty('--desktop-sheet-left');
        activeSheet = null;
        document.querySelectorAll('.builder-bottom-dock [data-open-sheet]').forEach(button => button.classList.remove('is-active'));
        refs.sheetBackdrop.classList.remove('is-visible');
        setTimeout(() => { if (!activeSheet) refs.sheetBackdrop.hidden = true; }, 240);
        document.body.classList.remove('sheet-open');
      }

      function openEditor() {
        if (!getSelected()) return toast('Toque primeiro em um bloco da página.', 'error');
        state.inspectorTab = state.inspectorTab || 'content';
        renderInspector();
        openSheet('editSheet');
      }

      function initSheetGestures() {
        document.querySelectorAll('.builder-sheet').forEach(sheet => {
          const handle = sheet.querySelector('.builder-sheet__grab');
          if (!handle) return;
          let startY = 0;
          let currentY = 0;
          let dragging = false;
          handle.addEventListener('pointerdown', event => {
            if (window.innerWidth >= 900) return;
            dragging = true;
            startY = event.clientY;
            currentY = startY;
            handle.setPointerCapture?.(event.pointerId);
            sheet.style.transition = 'none';
          });
          handle.addEventListener('pointermove', event => {
            if (!dragging) return;
            currentY = Math.max(startY, event.clientY);
            sheet.style.transform = `translateY(${currentY - startY}px)`;
          });
          const finish = () => {
            if (!dragging) return;
            dragging = false;
            sheet.style.removeProperty('transition');
            if (currentY - startY > 85) closeSheet();
            else sheet.style.removeProperty('transform');
          };
          handle.addEventListener('pointerup', finish);
          handle.addEventListener('pointercancel', finish);
        });
      }

      function openConfirm(title, text, callback) {
        $('#confirmTitle').textContent = title;
        $('#confirmText').textContent = text;
        confirmCallback = callback;
        window.bootstrap?.Modal.getOrCreateInstance($('#confirmModal')).show();
      }

      function toast(message, type = '') {
        if (window.pmToast) window.pmToast(message);
        else console.log(type ? `[${type}] ${message}` : message);
      }

      function renderAll() {
        refs.projectName.value = state.projectName || '';
        renderCanvas();
        renderLayers();
        renderInsertPositions();
        renderDesignPanel();
        renderInspector();
        updateHistoryButtons();
      }

      function bindUi() {
        document.querySelectorAll('[data-open-sheet]').forEach(button => button.onclick = () => openSheet(button.dataset.openSheet, button));
        document.querySelectorAll('[data-close-sheet]').forEach(button => button.onclick = closeSheet);
        refs.sheetBackdrop.onclick = closeSheet;
        refs.componentSearch.oninput = () => renderPalette(refs.componentSearch.value);
        refs.projectName.oninput = () => { state.projectName = refs.projectName.value; scheduleCommit(); };
        refs.selectedEditFab.onclick = openEditor;
        $('#undoBtn').onclick = undo;
        $('#redoBtn').onclick = redo;
        $('#previewBtn').onclick = previewPage;
        $('#saveBtn').onclick = saveProject;
        $('#publishBtn').onclick = publishProject;
        $('#newBtn').onclick = createNew;
        document.querySelectorAll('[data-inspector-tab]').forEach(button => button.onclick = () => {
          state.inspectorTab = button.dataset.inspectorTab;
          renderInspector();
        });
        $('#confirmAction').onclick = () => {
          const callback = confirmCallback;
          confirmCallback = null;
          window.bootstrap?.Modal.getOrCreateInstance($('#confirmModal')).hide();
          if (callback) callback();
        };
        refs.assetFileInput.onchange = () => handleAssetFile(refs.assetFileInput.files?.[0]);
        refs.assetUrlInput.oninput = () => {
          if (!refs.assetUrlInput.value.trim()) return;
          pendingAssetValue = refs.assetUrlInput.value.trim();
          pendingAssetName = pendingAssetName || (assetTarget?.type === 'pdf' ? 'Documento por link' : 'Imagem por link');
          updateAssetPreview();
        };
        $('#assetApplyBtn').onclick = applyAsset;
        refs.presetPreviewUse?.addEventListener('click', () => {
          if (!previewPresetId) return;
          window.bootstrap?.Modal.getOrCreateInstance($('#presetPreviewModal')).hide();
          setTimeout(() => applyPreset(previewPresetId), 180);
        });
        window.addEventListener('resize', () => {
          if (activeSheet && window.innerWidth >= 900) positionDesktopSheet(activeSheet, document.querySelector('.builder-bottom-dock [data-open-sheet].is-active'));
        });
        document.addEventListener('keydown', event => {
          if (event.key === 'Escape' && activeSheet) closeSheet();
          const modifier = event.ctrlKey || event.metaKey;
          if (modifier && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); }
          if (modifier && event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); }
          if (modifier && event.key.toLowerCase() === 's') { event.preventDefault(); saveProject(); }
          if (event.key === 'Delete' && state.selectedId && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) askDelete(state.selectedId);
        });
      }

      async function init() {
        renderPresets();
        renderPalette();
        bindUi();
        initSheetGestures();
        commit();
        renderAll();
        await refreshProjects();
      }

      init();
    })();
