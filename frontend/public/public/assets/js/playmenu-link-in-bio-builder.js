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
        if (/^(https?:|mailto:|tel:|sms:|whatsapp:)/i.test(url)) return url;
        if (/^#/.test(url)) return url;
        return 'https://' + url.replace(/^\/+/, '');
      };
      const nl2br = value => esc(value).replace(/\n/g, '<br>');
      const STORAGE_KEY = 'playmenu_bio_projects_design_system_v1';

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
        { category: 'Organização', type: 'footer', icon: '©', name: 'Rodapé', description: 'Créditos e informações finais' }
      ];

      const baseTheme = {
        background: '#f7f3ef', backgroundImage: '', primary: '#ff5b22', text: '#191614', muted: '#716a65', buttonText: '#ffffff',
        font: 'Inter', cardRadius: 18, blockGap: 12, horizontalPadding: 18, buttonStyle: 'filled', shadow: 'soft', socialStyle: 'circle',
        seoTitle: 'Meu estabelecimento', seoDescription: 'Conheça nosso cardápio, faça seu pedido e encontre todas as informações em um só lugar.',
        showBranding: true
      };

      const defaults = {
        profile: () => ({ businessName: 'Sabor & Brasa', category: 'Restaurante • Fortaleza', bio: 'Comida feita com ingredientes selecionados, sabor de verdade e atendimento que faz você se sentir em casa.', avatar: 'https://images.unsplash.com/photo-1572047635301-4858977e3d55?auto=format&fit=crop&w=300&q=85', cover: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=85', showStatus: true, statusText: 'Aberto agora' }),
        button: () => ({ label: 'Ver cardápio completo', subtitle: 'Conheça todos os nossos pratos', icon: '🍽️', url: '#cardapio' }),
        linksGrid: () => ({ title: 'Acessos rápidos', items: '🍽️ | Cardápio | #cardapio\n💬 | WhatsApp | https://wa.me/5585999999999\n📍 | Como chegar | https://maps.google.com\n📸 | Instagram | https://instagram.com' }),
        heading: () => ({ text: 'Destaques', subtitle: 'Veja o que preparamos para você' }),
        text: () => ({ text: 'Aceitamos pedidos todos os dias. Consulte disponibilidade, tempo de preparo e taxa de entrega pelo WhatsApp.' }),
        menu: () => ({ title: 'Nosso cardápio', subtitle: 'Escolha uma categoria', items: '🍔 | Hambúrgueres | 12 opções | #hamburgueres\n🍕 | Pizzas | 18 sabores | #pizzas\n🍟 | Porções | Para compartilhar | #porcoes\n🥤 | Bebidas | Geladas | #bebidas' }),
        product: () => ({ image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85', title: 'Brasa Supreme', description: 'Pão brioche, carne artesanal, cheddar, bacon crocante, cebola caramelizada e molho especial.', price: 'R$ 34,90', oldPrice: 'R$ 39,90', badge: 'Mais pedido', buttonLabel: 'Pedir agora', url: 'https://wa.me/5585999999999' }),
        promo: () => ({ eyebrow: 'Oferta exclusiva da bio', title: '10% OFF no primeiro pedido', text: 'Use o cupom abaixo ao fazer seu pedido pelo WhatsApp.', code: 'BEMVINDO10', linkLabel: 'Fazer pedido', url: 'https://wa.me/5585999999999' }),
        whatsapp: () => ({ label: 'Fazer pedido pelo WhatsApp', subtitle: 'Resposta rápida durante o horário de atendimento', phone: '5585999999999', message: 'Olá! Vim pelo Instagram e gostaria de fazer um pedido.', icon: '💬' }),
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
        spacer: () => ({ height: 28 }),
        footer: () => ({ text: '© 2026 Sabor & Brasa. Todos os direitos reservados.', showPowered: true })
      };

      const styleDefaults = () => ({ background: '', textColor: '', borderColor: '', borderRadius: '', padding: '', align: '', marginTop: 0, marginBottom: 0, shadow: '' });
      const makeElement = (type, data = {}, style = {}) => ({ id: uid(), type, hidden: false, data: { ...defaults[type](), ...data }, style: { ...styleDefaults(), ...style }, customId: '', customClass: '' });

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

      let state = {
        projectId: uid(), projectName: ' ', theme: clone(presets[0].theme), elements: presets[0].elements(), selectedId: null, inspectorTab: 'content', zoom: 1
      };
      let history = [];
      let historyIndex = -1;
      let recordTimer = null;
      let confirmCallback = null;
      let dragSourceId = null;
      let dragSourceType = null;

      const refs = {
        canvas: $('#bioCanvas'), phoneWrap: $('#phoneWrap'), projectName: $('#projectName'), inspectorBody: $('#inspectorBody'), inspectorTitle: $('#inspectorTitle'), inspectorSubtitle: $('#inspectorSubtitle'),
        componentPalette: $('#componentPalette'), presetList: $('#presetList'), presetModalGrid: $('#presetModalGrid'), layerList: $('#layerList'), designPanel: $('#designPanel'), projectList: $('#projectList'),
        leftPanel: $('#leftPanel'), rightPanel: $('#rightPanel'), zoomLabel: $('#zoomLabel')
      };

      function iconFor(type) { return componentDefinitions.find(c => c.type === type)?.icon || '▣'; }
      function nameFor(type) { return componentDefinitions.find(c => c.type === type)?.name || type; }
      function getSelected() { return state.elements.find(el => el.id === state.selectedId) || null; }

      function blockStyle(el) {
        const s = el.style || {};
        const shadowMap = { none: 'none', soft: '0 8px 24px rgba(17,24,39,.07)', strong: '0 14px 34px rgba(17,24,39,.17)' };
        const styles = [
          s.background ? `--block-bg:${s.background}` : '',
          s.textColor ? `--block-text:${s.textColor}` : '',
          s.borderColor ? `--block-border:${s.borderColor}` : '',
          s.borderRadius !== '' ? `--block-radius:${Number(s.borderRadius)}px` : '',
          s.padding !== '' ? `--block-padding:${Number(s.padding)}px` : '',
          s.align ? `--block-align:${s.align}` : '',
          s.shadow ? `--block-shadow:${shadowMap[s.shadow] || s.shadow}` : '',
          s.marginTop ? `margin-top:${Number(s.marginTop)}px` : '',
          s.marginBottom ? `margin-bottom:${Number(s.marginBottom)}px` : ''
        ].filter(Boolean).join(';');
        return styles;
      }

      function parseLines(value, count = Infinity) {
        return String(value || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean).slice(0, count);
      }
      function parsePipes(value, expected = 4) {
        return parseLines(value).map(line => {
          const parts = line.split('|').map(v => v.trim());
          while (parts.length < expected) parts.push('');
          return parts;
        });
      }

      function renderElement(el, exportMode = false) {
        const d = el.data; const style = blockStyle(el); const id = el.customId ? ` id="${escAttr(el.customId)}"` : '';
        const classSuffix = el.customClass ? ` ${escAttr(el.customClass)}` : '';
        const baseAttr = `${id} class="bio-component${classSuffix}" style="${escAttr(style)}"`;
        const linkedAttr = `${id} style="${escAttr(style)}"`;
        const linkAttrs = url => `href="${escAttr(safeUrl(url))}" target="_blank" rel="noopener noreferrer"`;
        const buttonStyle = `button-${state.theme.buttonStyle}`;
        switch (el.type) {
          case 'profile':
            return `<section ${baseAttr}>
              <div class="bio-profile">
                ${d.cover ? `<div class="bio-cover" style="background-image:url('${escAttr(d.cover)}')"></div>` : ''}
                <img class="bio-avatar" src="${escAttr(d.avatar)}" alt="Logo de ${escAttr(d.businessName)}" onerror="this.style.visibility='hidden'">
                <div class="category">${esc(d.category)}</div><h1>${esc(d.businessName)}</h1><p>${nl2br(d.bio)}</p>
                ${d.showStatus ? `<div class="status-pill"><span class="status-dot"></span>${esc(d.statusText)}</div>` : ''}
              </div>
            </section>`;
          case 'button':
            return `<a ${linkedAttr} class="bio-component bio-block bio-link ${buttonStyle}${classSuffix}" ${linkAttrs(d.url)}><span class="link-icon">${esc(d.icon)}</span><span class="link-copy"><strong>${esc(d.label)}</strong>${d.subtitle ? `<small>${esc(d.subtitle)}</small>` : ''}</span><span class="link-arrow">›</span></a>`;
          case 'linksGrid': {
            const items = parsePipes(d.items, 3).map(([icon,label,url]) => `<a class="grid-link" ${linkAttrs(url)}><span>${esc(icon || '🔗')}</span><strong>${esc(label)}</strong></a>`).join('');
            return `<section ${baseAttr}><div class="bio-block"><div class="links-grid">${items}</div></div></section>`;
          }
          case 'heading': return `<section ${baseAttr}><div class="bio-heading"><h2>${esc(d.text)}</h2>${d.subtitle ? `<p>${esc(d.subtitle)}</p>` : ''}</div></section>`;
          case 'text': return `<section ${baseAttr}><div class="bio-text">${nl2br(d.text)}</div></section>`;
          case 'menu': {
            const items = parsePipes(d.items, 4).map(([icon,title,subtitle,url]) => `<a class="menu-category" ${linkAttrs(url)}><span>${esc(icon || '🍽️')}</span><span><strong>${esc(title)}</strong><small>${esc(subtitle)}</small></span></a>`).join('');
            return `<section ${baseAttr}><div class="bio-block"><div class="bio-heading" style="padding:0 0 11px"><h2>${esc(d.title)}</h2><p>${esc(d.subtitle)}</p></div><div class="menu-categories">${items}</div></div></section>`;
          }
          case 'product': return `<section ${baseAttr}><article class="bio-block product-card"><div class="product-image" style="background-image:url('${escAttr(d.image)}')">${d.badge ? `<span class="product-badge">${esc(d.badge)}</span>` : ''}</div><div class="product-content"><div class="product-title-row"><h3>${esc(d.title)}</h3><div class="price">${d.oldPrice ? `<span class="old-price">${esc(d.oldPrice)}</span>` : ''}${esc(d.price)}</div></div><p>${esc(d.description)}</p><a class="small-cta" ${linkAttrs(d.url)}>${esc(d.buttonLabel)}</a></div></article></section>`;
          case 'promo': return `<section ${baseAttr}><article class="bio-block promo-card"><div class="promo-eyebrow">${esc(d.eyebrow)}</div><h3>${esc(d.title)}</h3><p>${esc(d.text)}</p><div class="coupon-row"><span class="coupon-code">${esc(d.code)}</span><a ${linkAttrs(d.url)}>${esc(d.linkLabel)} →</a></div></article></section>`;
          case 'whatsapp': {
            const text = encodeURIComponent(d.message || 'Olá! Gostaria de fazer um pedido.');
            const url = `https://wa.me/${String(d.phone || '').replace(/\D/g,'')}?text=${text}`;
            return `<a ${linkedAttr} class="bio-component bio-block bio-link ${buttonStyle}${classSuffix}" ${linkAttrs(url)}><span class="link-icon">${esc(d.icon || '💬')}</span><span class="link-copy"><strong>${esc(d.label)}</strong>${d.subtitle ? `<small>${esc(d.subtitle)}</small>` : ''}</span><span class="link-arrow">›</span></a>`;
          }
          case 'delivery': return `<section ${baseAttr}><div class="bio-block"><div class="bio-heading" style="padding:0 0 10px"><h2>${esc(d.title)}</h2><p>${esc(d.subtitle)}</p></div><div class="delivery-grid"><a class="delivery-item" ${linkAttrs(d.ifood)}><span>🟥</span><strong>iFood</strong></a><a class="delivery-item" ${linkAttrs(d.rappi)}><span>🟧</span><strong>Rappi</strong></a><a class="delivery-item" ${linkAttrs(d.own)}><span>💬</span><strong>Pedido direto</strong></a><a class="delivery-item" ${linkAttrs(d.own)}><span>🛍️</span><strong>Retirada</strong></a></div></div></section>`;
          case 'reservation': return `<section ${baseAttr}><div class="bio-block"><div class="info-row"><div class="info-row-icon">📅</div><div style="flex:1"><strong>${esc(d.title)}</strong><span>${esc(d.text)}</span></div></div><a class="small-cta" style="margin-top:12px" ${linkAttrs(d.url)}>${esc(d.label)}</a></div></section>`;
          case 'gallery': {
            const images = parseLines(d.images, 12).map((src,i) => `<img src="${escAttr(src)}" alt="Foto ${i+1} de ${escAttr(state.projectName)}" loading="lazy">`).join('');
            return `<section ${baseAttr}><div class="bio-heading"><h2>${esc(d.title)}</h2></div><div class="gallery" style="--gallery-cols:${Number(d.columns)||3}">${images}</div></section>`;
          }
          case 'video': return `<a ${id} class="bio-component bio-block video-card${classSuffix}" style="${escAttr(style)};background-image:url('${escAttr(d.cover)}')" ${linkAttrs(d.url)}><span class="video-play">▶</span><span class="video-caption"><strong>${esc(d.title)}</strong><small>${esc(d.subtitle)}</small></span></a>`;
          case 'location': return `<section ${baseAttr}><div class="bio-block info-list"><div class="info-row"><div class="info-row-icon">📍</div><div><strong>${esc(d.title)}</strong><a ${linkAttrs(d.url)}>${esc(d.address)}</a>${d.reference ? `<span>${esc(d.reference)}</span>` : ''}</div></div></div></section>`;
          case 'hours': {
            const rows = parsePipes(d.schedule,2).map(([day,time]) => `<div class="hours-row"><span>${esc(day)}</span><span>${esc(time)}</span></div>`).join('');
            return `<section ${baseAttr}><div class="bio-block"><div class="info-row" style="margin-bottom:11px"><div class="info-row-icon">🕒</div><div><strong>${esc(d.title)}</strong></div></div><div class="hours-list">${rows}</div></div></section>`;
          }
          case 'social': {
            const links = [['instagram','◎'],['tiktok','♪'],['facebook','f'],['youtube','▶'],['website','⌂']].filter(([key]) => d[key]).map(([key,icon]) => `<a class="social-link" ${linkAttrs(d[key])} aria-label="${key}">${icon}</a>`).join('');
            return `<section ${baseAttr}><div class="social-row">${links}</div></section>`;
          }
          case 'testimonial': return `<section ${baseAttr}><article class="bio-block testimonial"><div class="stars">${'★'.repeat(Math.max(1,Math.min(5,Number(d.rating)||5)))}</div><blockquote>“${esc(d.quote)}”</blockquote><cite><strong>${esc(d.name)}</strong>${d.role ? ` • ${esc(d.role)}` : ''}</cite></article></section>`;
          case 'wifi': return `<section ${baseAttr}><div class="bio-block"><div class="info-row"><div class="info-row-icon">📶</div><div><strong>${esc(d.title)}</strong><span>${esc(d.text)}</span></div></div><div class="wifi-code"><span><small style="display:block;color:var(--page-muted);font-size:8px">REDE</small><code>${esc(d.network)}</code></span><span><small style="display:block;color:var(--page-muted);font-size:8px">SENHA</small><code>${esc(d.password)}</code></span></div></div></section>`;
          case 'payments': {
            const methods = parseLines(d.methods,12).map(m => `<span class="payment-pill">${esc(m)}</span>`).join('');
            return `<section ${baseAttr}><div class="bio-block"><div class="info-row"><div class="info-row-icon">💳</div><div><strong>${esc(d.title)}</strong></div></div><div class="payment-icons">${methods}</div></div></section>`;
          }
          case 'divider': return `<section ${baseAttr}><div class="bio-divider" style="${escAttr(style)}"></div></section>`;
          case 'spacer': return `<section ${baseAttr}><div class="bio-spacer" style="--spacer-height:${Number(d.height)||28}px"></div></section>`;
          case 'footer': return `<footer ${baseAttr}><div class="bio-footer">${esc(d.text)}${d.showPowered && state.theme.showBranding ? '<br><span>Feito com <strong>PlayMenu Bio</strong></span>' : ''}</div></footer>`;
          default: return '';
        }
      }

      function editorNode(el) {
        const hidden = el.hidden ? ' is-hidden' : '';
        const selected = el.id === state.selectedId ? ' is-selected' : '';
        return `<div class="editor-node${hidden}${selected}" data-id="${el.id}" draggable="true" style="--node-gap:${state.theme.blockGap}px">
          <div class="node-tools"><button class="node-tool handle" title="Arrastar" data-node-action="drag">⋮⋮</button><button class="node-tool" title="Duplicar" data-node-action="duplicate">⧉</button><button class="node-tool" title="Ocultar" data-node-action="visibility">${el.hidden ? '◉' : '○'}</button><button class="node-tool" title="Excluir" data-node-action="delete">×</button></div>
          ${renderElement(el)}
        </div>`;
      }

      function pageVars() {
        const t = state.theme;
        const shadow = t.shadow === 'none' ? 'none' : t.shadow === 'strong' ? '0 14px 34px rgba(17,24,39,.17)' : '0 8px 24px rgba(17,24,39,.07)';
        const socialRadius = t.socialStyle === 'square' ? '12px' : t.socialStyle === 'rounded' ? '16px' : '50%';
        return `--page-bg:${t.background};--page-bg-image:${t.backgroundImage ? `url('${escAttr(t.backgroundImage)}')` : 'none'};--page-primary:${t.primary};--page-text:${t.text};--page-muted:${t.muted};--button-text:${t.buttonText};--page-font:'${escAttr(t.font)}';--card-radius:${Number(t.cardRadius)}px;--page-gap:${Number(t.blockGap)}px;--block-shadow:${shadow};--social-radius:${socialRadius};padding-left:${Number(t.horizontalPadding)}px;padding-right:${Number(t.horizontalPadding)}px;`;
      }

      function renderCanvas() {
        refs.canvas.setAttribute('style', pageVars());
        const visible = state.elements;
        refs.canvas.innerHTML = visible.length ? visible.map(editorNode).join('') : `<div class="canvas-empty"><div><div class="big">＋</div><strong>Adicione o primeiro bloco</strong><small>Abra “Adicionar elementos” e arraste um bloco para esta área.</small></div></div>`;
        bindCanvasEvents();
      }

      function bindCanvasEvents() {
        refs.canvas.onclick = e => {
          const action = e.target.closest('[data-node-action]');
          const node = e.target.closest('.editor-node');
          if (!node) return;
          e.preventDefault();
          e.stopPropagation();
          state.selectedId = node.dataset.id;
          if (action) {
            const act = action.dataset.nodeAction;
            if (act === 'duplicate') duplicateSelected();
            if (act === 'visibility') toggleVisibility(state.selectedId);
            if (act === 'delete') askDelete(state.selectedId);
          } else {
            renderCanvas(); renderInspector(); renderLayers();
            if (window.innerWidth <= 1050) refs.rightPanel.classList.add('is-open');
          }
        };
        $$('.editor-node', refs.canvas).forEach(node => {
          node.addEventListener('dragstart', e => {
            if (!e.target.closest('.handle')) { e.preventDefault(); return; }
            dragSourceId = node.dataset.id; dragSourceType = null;
            e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragSourceId);
            setTimeout(() => node.style.opacity = '.35', 0);
          });
          node.addEventListener('dragend', () => { node.style.opacity = ''; clearDropMarkers(); dragSourceId = null; });
        });
        refs.canvas.ondragover = e => {
          e.preventDefault();
          e.dataTransfer.dropEffect = dragSourceType ? 'copy' : 'move';
          showDropMarker(e.clientY);
        };
        refs.canvas.ondragleave = e => { if (!refs.canvas.contains(e.relatedTarget)) clearDropMarkers(); };
        refs.canvas.ondrop = e => {
          e.preventDefault();
          const target = e.target.closest('.editor-node');
          const targetId = target?.dataset.id;
          const rect = target?.getBoundingClientRect();
          const after = rect ? e.clientY > rect.top + rect.height / 2 : true;
          if (dragSourceType) addElement(dragSourceType, targetId, after);
          else if (dragSourceId) reorderElement(dragSourceId, targetId, after);
          dragSourceType = null; dragSourceId = null; clearDropMarkers();
        };
      }

      function clearDropMarkers() { $$('.drop-marker', refs.canvas).forEach(m => m.remove()); }
      function showDropMarker(clientY) {
        clearDropMarkers();
        const nodes = $$('.editor-node', refs.canvas);
        const marker = document.createElement('div'); marker.className = 'drop-marker';
        if (!nodes.length) { refs.canvas.appendChild(marker); return; }
        let placed = false;
        for (const node of nodes) {
          const r = node.getBoundingClientRect();
          if (clientY < r.top + r.height / 2) { refs.canvas.insertBefore(marker, node); placed = true; break; }
        }
        if (!placed) refs.canvas.appendChild(marker);
      }

      function addElement(type, targetId = null, after = true) {
        const el = makeElement(type); let index = state.elements.length;
        if (targetId) { const targetIndex = state.elements.findIndex(x => x.id === targetId); index = targetIndex + (after ? 1 : 0); }
        state.elements.splice(index, 0, el); state.selectedId = el.id; commit(); renderAll(); toast(`${nameFor(type)} adicionado.`, 'success');
      }
      function reorderElement(sourceId, targetId, after) {
        if (!sourceId || sourceId === targetId) return;
        const from = state.elements.findIndex(x => x.id === sourceId); if (from < 0) return;
        const [item] = state.elements.splice(from, 1);
        let to = targetId ? state.elements.findIndex(x => x.id === targetId) : state.elements.length - 1;
        if (to < 0) to = state.elements.length;
        state.elements.splice(to + (after ? 1 : 0), 0, item); commit(); renderAll();
      }
      function duplicateSelected() {
        const el = getSelected(); if (!el) return;
        const copy = clone(el); copy.id = uid(); copy.data = { ...copy.data }; const index = state.elements.findIndex(x => x.id === el.id);
        state.elements.splice(index + 1, 0, copy); state.selectedId = copy.id; commit(); renderAll(); toast('Bloco duplicado.', 'success');
      }
      function toggleVisibility(id) { const el = state.elements.find(x => x.id === id); if (!el) return; el.hidden = !el.hidden; commit(); renderAll(); }
      function askDelete(id) {
        const el = state.elements.find(x => x.id === id); if (!el) return;
        openConfirm('Excluir bloco', `Deseja excluir “${nameFor(el.type)}”? Esta ação poderá ser desfeita pelo botão Desfazer.`, () => {
          state.elements = state.elements.filter(x => x.id !== id); if (state.selectedId === id) state.selectedId = null; commit(); renderAll(); toast('Bloco excluído.');
        });
      }

      function renderPalette(filter = '') {
        const term = filter.trim().toLowerCase();
        const filtered = componentDefinitions.filter(c => !term || `${c.name} ${c.description} ${c.category}`.toLowerCase().includes(term));
        const categories = [...new Set(filtered.map(c => c.category))];
        refs.componentPalette.innerHTML = categories.map(cat => `<div class="section-title"><span>${esc(cat)}</span></div><div class="component-grid">${filtered.filter(c => c.category === cat).map(c => `<button class="component-card" draggable="true" data-component-type="${c.type}"><span class="component-icon">${c.icon}</span><strong>${esc(c.name)}</strong><small>${esc(c.description)}</small></button>`).join('')}</div>`).join('') || '<div class="empty-inspector"><div><strong>Nenhum bloco encontrado</strong></div></div>';
        $$('[data-component-type]', refs.componentPalette).forEach(card => {
          card.onclick = () => addElement(card.dataset.componentType);
          card.ondragstart = e => { dragSourceType = card.dataset.componentType; dragSourceId = null; e.dataTransfer.effectAllowed = 'copy'; e.dataTransfer.setData('text/plain', dragSourceType); };
          card.ondragend = () => { dragSourceType = null; clearDropMarkers(); };
        });
      }

      function presetCard(preset, compact = false) {
        return `<article class="preset-card"><div class="preset-thumb" style="background:${preset.thumb}"><div class="mini-page" style="background:${preset.colors[0]};color:${preset.colors[1]}"><div class="mini-avatar"></div><div class="mini-line w1" style="background:${preset.colors[1]}"></div><div class="mini-line w2" style="background:${preset.colors[1]}"></div><div class="mini-button" style="background:${preset.colors[2]}"></div><div class="mini-card"></div><div class="mini-button" style="background:${preset.colors[1]}"></div></div></div><div class="preset-info"><div><strong>${esc(preset.name)}</strong><small>${esc(preset.description)}</small></div><button class="btn btn-sm btn-outline-primary" data-apply-preset="${preset.id}">Usar</button></div></article>`;
      }
      function renderPresets() {
        refs.presetList.innerHTML = presets.map(p => presetCard(p)).join('');
        refs.presetModalGrid.innerHTML = presets.map(p => presetCard(p, true)).join('');
        $$('[data-apply-preset]').forEach(btn => btn.onclick = () => applyPreset(btn.dataset.applyPreset));
      }
      function applyPreset(id) {
        const preset = presets.find(p => p.id === id); if (!preset) return;
        openConfirm('Aplicar modelo', `O modelo “${preset.name}” substituirá os blocos e as cores atuais desta página.`, () => {
          state.theme = clone(preset.theme); state.elements = preset.elements(); state.selectedId = null; commit(); renderAll(); closeModals(); toast(`Modelo “${preset.name}” aplicado.`, 'success');
        });
      }

      function renderLayers() {
        refs.layerList.innerHTML = state.elements.map((el,index) => `<div class="layer-item ${el.id === state.selectedId ? 'is-selected' : ''}" draggable="true" data-layer-id="${el.id}"><span class="layer-grip">⋮⋮</span><span class="layer-icon">${iconFor(el.type)}</span><span class="layer-name"><strong>${esc(layerTitle(el))}</strong><small>${esc(nameFor(el.type))}</small></span><button class="layer-action" data-layer-action="visibility" title="Mostrar ou ocultar">${el.hidden ? '◉' : '○'}</button><button class="layer-action" data-layer-action="delete" title="Excluir">×</button></div>`).join('') || '<div class="empty-inspector"><div><strong>Nenhum bloco</strong><small>Adicione elementos para organizar a página.</small></div></div>';
        $$('[data-layer-id]', refs.layerList).forEach(item => {
          item.onclick = e => {
            const action = e.target.closest('[data-layer-action]'); state.selectedId = item.dataset.layerId;
            if (action?.dataset.layerAction === 'visibility') toggleVisibility(state.selectedId);
            else if (action?.dataset.layerAction === 'delete') askDelete(state.selectedId);
            else { renderAll(); if (window.innerWidth <= 1050) refs.rightPanel.classList.add('is-open'); }
          };
          item.ondragstart = e => { dragSourceId = item.dataset.layerId; e.dataTransfer.setData('text/plain', dragSourceId); };
          item.ondragover = e => e.preventDefault();
          item.ondrop = e => { e.preventDefault(); const r = item.getBoundingClientRect(); reorderElement(dragSourceId, item.dataset.layerId, e.clientY > r.top + r.height/2); };
        });
      }
      function layerTitle(el) {
        return el.data.businessName || el.data.label || el.data.title || el.data.text || nameFor(el.type);
      }

      function fieldHtml(label, field, value, type = 'text', help = '', options = []) {
        if (type === 'textarea') return `<div class="field"><label>${label}</label><textarea class="form-control" data-field="${field}">${esc(value)}</textarea>${help ? `<div class="help">${help}</div>` : ''}</div>`;
        if (type === 'select') return `<div class="field"><label>${label}</label><select class="form-select" data-field="${field}">${options.map(o => `<option value="${escAttr(o.value)}" ${String(o.value)===String(value)?'selected':''}>${esc(o.label)}</option>`).join('')}</select>${help ? `<div class="help">${help}</div>` : ''}</div>`;
        if (type === 'checkbox') return `<div class="form-check form-switch d-flex align-items-center justify-content-between gap-3 mb-3 ps-0"><label class="form-check-label small fw-semibold" for="switch-${field.replace(/[^a-z0-9]/gi,'')}">${label}</label><input class="form-check-input ms-0" id="switch-${field.replace(/[^a-z0-9]/gi,'')}" type="checkbox" role="switch" data-field="${field}" ${value ? 'checked' : ''}></div>${help ? `<div class="help">${help}</div>` : ''}`;
        if (type === 'image') return `<div class="field"><label>${label}</label><div class="upload-row"><input class="form-control" type="url" data-field="${field}" value="${escAttr(value)}" placeholder="https://..."><label class="btn btn-outline-secondary btn-sm mb-0">Enviar<input type="file" accept="image/*" data-upload-field="${field}" hidden></label></div>${help ? `<div class="help">${help}</div>` : ''}</div>`;
        return `<div class="field"><label>${label}</label><input class="form-control" type="${type}" data-field="${field}" value="${escAttr(value)}">${help ? `<div class="help">${help}</div>` : ''}</div>`;
      }

      function contentFields(el) {
        const d = el.data;
        switch (el.type) {
          case 'profile': return fieldHtml('Nome do estabelecimento','businessName',d.businessName)+fieldHtml('Categoria e cidade','category',d.category)+fieldHtml('Descrição curta','bio',d.bio,'textarea','Mantenha entre 1 e 3 linhas para facilitar a leitura.')+fieldHtml('Logo ou foto do perfil','avatar',d.avatar,'image')+fieldHtml('Imagem de capa','cover',d.cover,'image')+fieldHtml('Mostrar status','showStatus',d.showStatus,'checkbox')+fieldHtml('Texto do status','statusText',d.statusText);
          case 'button': return fieldHtml('Texto do botão','label',d.label)+fieldHtml('Descrição opcional','subtitle',d.subtitle)+fieldHtml('Ícone ou emoji','icon',d.icon)+fieldHtml('Link de destino','url',d.url,'url');
          case 'linksGrid': return fieldHtml('Links','items',d.items,'textarea','Use uma linha por link: Ícone | Nome | URL');
          case 'heading': return fieldHtml('Título','text',d.text)+fieldHtml('Subtítulo','subtitle',d.subtitle);
          case 'text': return fieldHtml('Texto','text',d.text,'textarea');
          case 'menu': return fieldHtml('Título','title',d.title)+fieldHtml('Subtítulo','subtitle',d.subtitle)+fieldHtml('Categorias','items',d.items,'textarea','Uma linha por categoria: Emoji | Nome | Descrição | Link');
          case 'product': return fieldHtml('Imagem do produto','image',d.image,'image')+fieldHtml('Nome do produto','title',d.title)+fieldHtml('Descrição','description',d.description,'textarea')+fieldHtml('Preço atual','price',d.price)+fieldHtml('Preço anterior','oldPrice',d.oldPrice)+fieldHtml('Selo','badge',d.badge)+fieldHtml('Texto do botão','buttonLabel',d.buttonLabel)+fieldHtml('Link do pedido','url',d.url,'url');
          case 'promo': return fieldHtml('Chamada superior','eyebrow',d.eyebrow)+fieldHtml('Título da promoção','title',d.title)+fieldHtml('Descrição','text',d.text,'textarea')+fieldHtml('Código do cupom','code',d.code)+fieldHtml('Texto do link','linkLabel',d.linkLabel)+fieldHtml('Link','url',d.url,'url');
          case 'whatsapp': return fieldHtml('Texto principal','label',d.label)+fieldHtml('Descrição','subtitle',d.subtitle)+fieldHtml('Ícone ou emoji','icon',d.icon)+fieldHtml('WhatsApp com DDD e país','phone',d.phone,'tel','Exemplo: 5585999999999')+fieldHtml('Mensagem automática','message',d.message,'textarea');
          case 'delivery': return fieldHtml('Título','title',d.title)+fieldHtml('Subtítulo','subtitle',d.subtitle)+fieldHtml('Link do iFood','ifood',d.ifood,'url')+fieldHtml('Link da Rappi','rappi',d.rappi,'url')+fieldHtml('Pedido próprio ou WhatsApp','own',d.own,'url');
          case 'reservation': return fieldHtml('Título','title',d.title)+fieldHtml('Descrição','text',d.text)+fieldHtml('Texto do botão','label',d.label)+fieldHtml('Link da reserva','url',d.url,'url');
          case 'gallery': return fieldHtml('Título','title',d.title)+fieldHtml('Imagens','images',d.images,'textarea','Cole uma URL de imagem por linha. Até 12 imagens.')+fieldHtml('Colunas','columns',d.columns,'select','',[{value:2,label:'2 colunas'},{value:3,label:'3 colunas'}]);
          case 'video': return fieldHtml('Imagem de capa','cover',d.cover,'image')+fieldHtml('Título','title',d.title)+fieldHtml('Subtítulo','subtitle',d.subtitle)+fieldHtml('Link do vídeo ou Reel','url',d.url,'url');
          case 'location': return fieldHtml('Título','title',d.title)+fieldHtml('Endereço','address',d.address,'textarea')+fieldHtml('Referência','reference',d.reference)+fieldHtml('Link do Google Maps','url',d.url,'url');
          case 'hours': return fieldHtml('Título','title',d.title)+fieldHtml('Horários','schedule',d.schedule,'textarea','Uma linha por período: Dia | Horário');
          case 'social': return fieldHtml('Instagram','instagram',d.instagram,'url')+fieldHtml('TikTok','tiktok',d.tiktok,'url')+fieldHtml('Facebook','facebook',d.facebook,'url')+fieldHtml('YouTube','youtube',d.youtube,'url')+fieldHtml('Site','website',d.website,'url');
          case 'testimonial': return fieldHtml('Depoimento','quote',d.quote,'textarea')+fieldHtml('Nome do cliente','name',d.name)+fieldHtml('Identificação','role',d.role)+fieldHtml('Nota','rating',d.rating,'select','',[1,2,3,4,5].map(v=>({value:v,label:`${v} estrela${v>1?'s':''}`})));
          case 'wifi': return fieldHtml('Título','title',d.title)+fieldHtml('Texto de apoio','text',d.text)+fieldHtml('Nome da rede','network',d.network)+fieldHtml('Senha','password',d.password);
          case 'payments': return fieldHtml('Título','title',d.title)+fieldHtml('Formas aceitas','methods',d.methods,'textarea','Uma forma de pagamento por linha.');
          case 'spacer': return fieldHtml('Altura do espaço','height',d.height,'number');
          case 'footer': return fieldHtml('Texto do rodapé','text',d.text)+fieldHtml('Mostrar “Feito com PlayMenu Bio”','showPowered',d.showPowered,'checkbox');
          case 'divider': return '<div class="help">Este bloco cria uma linha de separação. Use a aba Estilo para personalizá-la.</div>';
          default: return '';
        }
      }

      function styleFields(el) {
        const s = el.style || {};
        return `<div class="design-group"><h4>Aparência do bloco</h4>
          ${fieldHtml('Fundo personalizado','background',s.background,'text','Aceita cor em hexadecimal, como #ffffff. Deixe vazio para usar o padrão.')}
          ${fieldHtml('Cor do texto','textColor',s.textColor,'text')}
          ${fieldHtml('Cor da borda','borderColor',s.borderColor,'text')}
          ${fieldHtml('Alinhamento','align',s.align,'select','',[{value:'',label:'Padrão do bloco'},{value:'left',label:'Esquerda'},{value:'center',label:'Centro'},{value:'right',label:'Direita'}])}
          ${fieldHtml('Arredondamento em px','borderRadius',s.borderRadius,'number')}
          ${fieldHtml('Espaçamento interno em px','padding',s.padding,'number')}
          ${fieldHtml('Sombra','shadow',s.shadow,'select','',[{value:'',label:'Usar padrão da página'},{value:'none',label:'Sem sombra'},{value:'soft',label:'Suave'},{value:'strong',label:'Forte'}])}
        </div>`;
      }

      function advancedFields(el) {
        return `<div class="design-group"><h4>Posição e identificação</h4>
          ${fieldHtml('Margem superior em px','marginTop',el.style.marginTop,'number')}
          ${fieldHtml('Margem inferior em px','marginBottom',el.style.marginBottom,'number')}
          ${fieldHtml('ID personalizado','@customId',el.customId,'text','Opcional. Útil para links internos, como #cardapio.')}
          ${fieldHtml('Classe CSS personalizada','@customClass',el.customClass,'text')}
          ${fieldHtml('Ocultar bloco','@hidden',el.hidden,'checkbox')}
        </div><div class="action-grid"><button class="btn btn-outline-secondary" data-inspector-action="duplicate"><i class="bi bi-copy me-1"></i>Duplicar</button><button class="btn btn-danger" data-inspector-action="delete"><i class="bi bi-trash me-1"></i>Excluir</button></div>`;
      }

      function renderInspector() {
        const el = getSelected();
        if (!el) {
          refs.inspectorTitle.textContent = 'Nenhum bloco selecionado'; refs.inspectorSubtitle.textContent = 'Clique em um bloco da página para editar.';
          refs.inspectorBody.innerHTML = '<div class="empty-inspector"><div><div class="icon">☝️</div><strong>Selecione um bloco</strong><small>Você poderá alterar textos, links, imagens, cores e configurações.</small></div></div>';
          return;
        }
        refs.inspectorTitle.textContent = layerTitle(el); refs.inspectorSubtitle.textContent = nameFor(el.type);
        refs.inspectorBody.innerHTML = state.inspectorTab === 'content' ? contentFields(el) : state.inspectorTab === 'style' ? styleFields(el) : advancedFields(el);
        bindInspectorFields(el);
      }

      function bindInspectorFields(el) {
        $$('[data-field]', refs.inspectorBody).forEach(input => {
          const apply = () => {
            const key = input.dataset.field; let value = input.type === 'checkbox' ? input.checked : input.value;
            if (input.type === 'number' && value !== '') value = Number(value);
            if (key.startsWith('@')) { const prop = key.slice(1); el[prop] = value; }
            else if (Object.prototype.hasOwnProperty.call(el.style, key) && state.inspectorTab !== 'content') el.style[key] = value;
            else el.data[key] = value;
            renderCanvas(); renderLayers(); scheduleCommit();
          };
          input.addEventListener(input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'input', apply);
        });
        $$('[data-upload-field]', refs.inspectorBody).forEach(input => input.onchange = async () => {
          const file = input.files?.[0]; if (!file) return;
          if (file.size > 2.5 * 1024 * 1024) { toast('Use uma imagem com até 2,5 MB.', 'error'); return; }
          const dataUrl = await fileToDataUrl(file); el.data[input.dataset.uploadField] = dataUrl; commit(); renderAll(); toast('Imagem adicionada.', 'success');
        });
        $$('[data-inspector-action]', refs.inspectorBody).forEach(btn => btn.onclick = () => btn.dataset.inspectorAction === 'duplicate' ? duplicateSelected() : askDelete(el.id));
      }

      function renderDesignPanel() {
        const t = state.theme;
        refs.designPanel.innerHTML = `<div class="design-group"><h4>Cores da marca</h4>
          ${colorField('Fundo da página','background',t.background)}${themeImageField('Imagem de fundo','backgroundImage',t.backgroundImage)}
          ${colorField('Cor principal','primary',t.primary)}${colorField('Texto principal','text',t.text)}${colorField('Texto secundário','muted',t.muted)}${colorField('Texto dos botões','buttonText',t.buttonText)}
        </div>
        <div class="design-group"><h4>Formato e tipografia</h4>
          ${fieldHtml('Fonte','font',t.font,'select','',[{value:'Inter',label:'Inter — moderna'},{value:'Poppins',label:'Poppins — amigável'},{value:'Roboto',label:'Roboto — neutra'},{value:'Playfair Display',label:'Playfair Display — elegante'}])}
          ${rangeField('Arredondamento dos cards','cardRadius',t.cardRadius,4,32,'px')}
          ${rangeField('Espaço entre blocos','blockGap',t.blockGap,4,28,'px')}
          ${rangeField('Margem lateral','horizontalPadding',t.horizontalPadding,10,28,'px')}
          ${fieldHtml('Estilo dos botões','buttonStyle',t.buttonStyle,'select','',[{value:'filled',label:'Preenchido'},{value:'outline',label:'Contorno'},{value:'soft',label:'Suave'}])}
          ${fieldHtml('Sombra dos cards','shadow',t.shadow,'select','',[{value:'none',label:'Sem sombra'},{value:'soft',label:'Suave'},{value:'strong',label:'Forte'}])}
          ${fieldHtml('Formato das redes','socialStyle',t.socialStyle,'select','',[{value:'circle',label:'Circular'},{value:'rounded',label:'Arredondado'},{value:'square',label:'Quadrado'}])}
        </div>
        <div class="design-group"><h4>SEO e publicação</h4>${fieldHtml('Título da página','seoTitle',t.seoTitle)}${fieldHtml('Descrição para buscadores','seoDescription',t.seoDescription,'textarea')}${fieldHtml('Mostrar marca PlayMenu','showBranding',t.showBranding,'checkbox')}</div>`;
        $$('[data-theme-field]', refs.designPanel).forEach(input => {
          const apply = () => { let value = input.type === 'checkbox' ? input.checked : input.value; if (input.type === 'range') value = Number(value); state.theme[input.dataset.themeField] = value; const val = input.closest('.field')?.querySelector('[data-range-value]'); if (val) val.textContent = `${value}${val.dataset.suffix || ''}`; renderCanvas(); scheduleCommit(); };
          input.addEventListener(input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'input', apply);
        });
        $$('[data-theme-upload]', refs.designPanel).forEach(input => input.onchange = async () => { const file = input.files?.[0]; if (!file) return; if (file.size > 2.5*1024*1024) return toast('Use uma imagem com até 2,5 MB.','error'); state.theme[input.dataset.themeUpload] = await fileToDataUrl(file); commit(); renderAll(); });
      }
      function colorField(label, key, value) { return `<div class="field"><label>${label}</label><div class="color-row"><input class="form-control form-control-color" type="color" data-theme-field="${key}" value="${escAttr(value)}"><input class="form-control" type="text" data-theme-field="${key}" value="${escAttr(value)}"></div></div>`; }
      function themeImageField(label, key, value) { return `<div class="field"><label>${label}</label><div class="upload-row"><input class="form-control" type="url" data-theme-field="${key}" value="${escAttr(value)}" placeholder="https://..."><label class="btn btn-outline-secondary btn-sm mb-0">Enviar<input type="file" accept="image/*" data-theme-upload="${key}" hidden></label></div><div class="help">Opcional. A imagem cobre todo o fundo da página.</div></div>`; }
      function rangeField(label,key,value,min,max,suffix='') { return `<div class="field"><label>${label}<span class="badge text-bg-secondary" data-range-value data-suffix="${suffix}">${value}${suffix}</span></label><div class="range-row"><input class="form-range" type="range" min="${min}" max="${max}" value="${value}" data-theme-field="${key}"><input class="form-control form-control-sm" type="number" min="${min}" max="${max}" value="${value}" data-theme-field="${key}"></div></div>`; }

      function renderAll() { refs.projectName.value = state.projectName; renderCanvas(); renderInspector(); renderLayers(); renderDesignPanel(); updateZoom(); updateHistoryButtons(); }

      function snapshot() { return clone({ projectId: state.projectId, projectName: state.projectName, theme: state.theme, elements: state.elements, selectedId: state.selectedId }); }
      function commit() {
        clearTimeout(recordTimer); const snap = snapshot(); const prev = history[historyIndex]; if (prev && JSON.stringify(prev) === JSON.stringify(snap)) return;
        history = history.slice(0, historyIndex + 1); history.push(snap); if (history.length > 80) history.shift(); historyIndex = history.length - 1; updateHistoryButtons();
      }
      function scheduleCommit() { clearTimeout(recordTimer); recordTimer = setTimeout(commit, 450); }
      function applySnapshot(snap) { state = { ...state, ...clone(snap) }; renderAll(); }
      function undo() { if (historyIndex <= 0) return; historyIndex--; applySnapshot(history[historyIndex]); }
      function redo() { if (historyIndex >= history.length - 1) return; historyIndex++; applySnapshot(history[historyIndex]); }
      function updateHistoryButtons() { $('#undoBtn').disabled = historyIndex <= 0; $('#redoBtn').disabled = historyIndex >= history.length - 1; }

      function saveProject() {
        state.projectName = refs.projectName.value.trim() || 'Página sem título';
        const projects = getProjects(); const index = projects.findIndex(p => p.projectId === state.projectId); const payload = { ...snapshot(), updatedAt: new Date().toISOString() };
        if (index >= 0) projects[index] = payload; else projects.unshift(payload);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.slice(0,40))); commit(); toast('Projeto salvo neste navegador.', 'success');
      }
      function getProjects() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } }
      function renderProjectList() {
        const projects = getProjects();
        refs.projectList.innerHTML = projects.length ? projects.map(p => `<div class="project-row"><div><strong>${esc(p.projectName)}</strong><small>Atualizado em ${new Date(p.updatedAt).toLocaleString('pt-BR')}</small></div><button class="btn btn-sm btn-outline-primary" data-load-project="${p.projectId}">Abrir</button><button class="btn btn-sm btn-danger" data-delete-project="${p.projectId}">Excluir</button></div>`).join('') : '<div class="empty-inspector"><div><div class="icon">📁</div><strong>Nenhum projeto salvo</strong><small>Use o botão Salvar para guardar esta página no navegador.</small></div></div>';
        $$('[data-load-project]', refs.projectList).forEach(btn => btn.onclick = () => { const p = getProjects().find(x => x.projectId === btn.dataset.loadProject); if (!p) return; state = { ...state, ...clone(p), inspectorTab:'content', zoom:1 }; history=[]; historyIndex=-1; commit(); renderAll(); closeModals(); toast('Projeto aberto.','success'); });
        $$('[data-delete-project]', refs.projectList).forEach(btn => btn.onclick = () => openConfirm('Excluir projeto','Deseja remover este projeto salvo do navegador?',() => { const list=getProjects().filter(x=>x.projectId!==btn.dataset.deleteProject); localStorage.setItem(STORAGE_KEY,JSON.stringify(list)); renderProjectList(); toast('Projeto removido.'); }));
      }

      function createNew() {
        openConfirm('Criar nova página','A página atual será substituída. Salve o projeto antes caso queira preservá-lo.',() => {
          state = { projectId:uid(), projectName:'Nova página link in bio', theme:clone(baseTheme), elements:[], selectedId:null, inspectorTab:'content', zoom:1 };
          history=[]; historyIndex=-1; commit(); renderAll(); closeModals(); switchPanel('presets'); openModal('templatesModal');
        });
      }

      function generatePreviewDocument() {
        const t = state.theme;
        const visibleElements = state.elements.filter(el => !el.hidden).map(el => renderElement(el, true)).join('\n');
        const sourceCss = document.getElementById('bio-builder-page-styles')?.textContent || '';
        const startMarker = '/* BIO PAGE STYLES START */';
        const endMarker = '/* BIO PAGE STYLES END */';
        const start = sourceCss.indexOf(startMarker);
        const end = sourceCss.indexOf(endMarker);
        const pageCss = start >= 0 ? sourceCss.slice(start + startMarker.length, end > start ? end : undefined) : '';
        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>${esc(t.seoTitle || state.projectName)}</title>
<meta name="description" content="${escAttr(t.seoDescription)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700&family=Poppins:wght@400;500;600;700;800&family=Roboto:wght@400;500;700;900&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#111}body{font-family:${esc(t.font)},sans-serif}${pageCss}@media(max-width:430px){html,body{background:var(--page-bg,#fff)}.mobile-page-shell{box-shadow:none}}</style>
</head>
<body><main class="mobile-page-shell"><div class="bio-page" style="${pageVars()}">${visibleElements}</div></main></body>
</html>`;
      }
      function previewPage() {
        const win = window.open('', '_blank');
        if (!win) return toast('O navegador bloqueou a visualização. Permita pop-ups para este site.', 'error');
        win.document.open();
        win.document.write(generatePreviewDocument());
        win.document.close();
      }
      function fileToDataUrl(file) { return new Promise((resolve,reject)=>{ const reader=new FileReader(); reader.onload=()=>resolve(reader.result); reader.onerror=reject; reader.readAsDataURL(file); }); }

      function openModal(id) {
        const element = $('#' + id);
        if (element && window.bootstrap) window.bootstrap.Modal.getOrCreateInstance(element).show();
      }
      function closeModals() {
        $$('.modal.show').forEach(element => window.bootstrap?.Modal.getOrCreateInstance(element).hide());
        confirmCallback = null;
      }
      function openConfirm(title,text,callback) { $('#confirmTitle').textContent=title; $('#confirmText').textContent=text; confirmCallback=callback; openModal('confirmModal'); }
      function toast(message,type='') { if (window.pmToast) window.pmToast(message); else console.log(type ? `[${type}] ${message}` : message); }
      function switchPanel(name) {
        $$('.rail-btn[data-panel]').forEach(button => {
          const active = button.dataset.panel === name;
          button.classList.toggle('is-active', active);
          button.classList.toggle('active', active);
        });
        $$('.panel-view').forEach(view => view.classList.toggle('is-active', view.dataset.view === name));
      }
      function updateZoom() { refs.phoneWrap.style.transform=`scale(${state.zoom})`; refs.zoomLabel.textContent=`${Math.round(state.zoom*100)}%`; }

      function bindUi() {
        $$('.rail-btn[data-panel]').forEach(btn => btn.onclick = () => switchPanel(btn.dataset.panel));
        $('#componentSearch').oninput = e => renderPalette(e.target.value);
        $$('.inspector-tabs button').forEach(btn => btn.onclick = () => {
          state.inspectorTab = btn.dataset.inspectorTab;
          $$('.inspector-tabs button').forEach(item => item.classList.toggle('active', item === btn));
          renderInspector();
        });
        refs.projectName.oninput = () => { state.projectName = refs.projectName.value; scheduleCommit(); };
        $('#undoBtn').onclick = undo;
        $('#redoBtn').onclick = redo;
        $('#saveBtn').onclick = saveProject;
        $('#previewBtn').onclick = previewPage;
        $('#newBtn').onclick = createNew;
        $('#projectsBtn').onclick = () => { renderProjectList(); openModal('projectsModal'); };
        $('#templatesBtn').onclick = () => openModal('templatesModal');
        $('#zoomOut').onclick = () => { state.zoom=Math.max(.65,Math.round((state.zoom-.1)*10)/10); updateZoom(); };
        $('#zoomIn').onclick = () => { state.zoom=Math.min(1.25,Math.round((state.zoom+.1)*10)/10); updateZoom(); };
        $('#fitBtn').onclick = () => {
          const stage = $('#stage');
          const availableWidth = Math.max(280, stage.clientWidth - 40);
          state.zoom = Math.min(1, availableWidth / 430);
          updateZoom();
        };
        $('#confirmAction').onclick = () => {
          const fn = confirmCallback;
          const modal = window.bootstrap?.Modal.getOrCreateInstance($('#confirmModal'));
          modal?.hide();
          confirmCallback = null;
          if (fn) fn();
        };
        document.addEventListener('keydown', e => {
          const mod = e.ctrlKey || e.metaKey;
          if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
          if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
          if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); saveProject(); }
          if (e.key === 'Delete' && state.selectedId && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) askDelete(state.selectedId);
        });
      }

      function init() {
        renderPresets(); renderPalette(); bindUi(); commit(); renderAll();
        if (!localStorage.getItem('playmenu_bio_builder_ds_seen')) { localStorage.setItem('playmenu_bio_builder_ds_seen','1'); setTimeout(()=>openModal('templatesModal'),250); }
      }
      init();
    })();
