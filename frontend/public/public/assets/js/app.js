var qs = function(s, el){ return (el||document).querySelector(s); };

function trackMenuEvent(payload){
  var cfg = window.PLAYMENU_ANALYTICS || {};
  if(!cfg.endpoint) return;
  payload = payload || {};
  if(cfg.restaurantId && !payload.restaurant_id) payload.restaurant_id = cfg.restaurantId;

  try {
    var body = JSON.stringify(payload);
    if(navigator.sendBeacon){
      var blob = new Blob([body], {type: 'application/json'});
      navigator.sendBeacon(cfg.endpoint, blob);
      return;
    }
    fetch(cfg.endpoint, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: body,
      keepalive: true
    }).catch(function(){});
  } catch(e) {}
}

function openModalWithProduct(id){
  trackMenuEvent({event_type: 'product_view', product_id: parseInt(id, 10) || 0});
  fetch('api_product.php?id='+encodeURIComponent(id))
    .then(function(r){ return r.json(); })
    .then(function(p){
      if(!p || p.error) return;

      var modal = qs('#modal');
      var video = qs('#modalVideo');
      var image = qs('#modalImage');
      var sound = qs('#btnSound');
      var title = qs('#sheetTitle');
      var desc = qs('#sheetDesc');
      var price = qs('#sheetPrice');

      title.textContent = p.title || '';
      desc.textContent = p.description || '';
      price.textContent = p.price || '';

      video.pause();
      video.removeAttribute('src');
      video.style.display = 'none';
      if(image){
        image.removeAttribute('src');
        image.style.display = 'none';
      }

      if(p.video_url){
        video.src = p.video_url;
        video.style.display = 'block';
        if(sound) sound.style.display = 'flex';
        video.load();
      } else if(image && p.image_url){
        image.src = p.image_url;
        image.style.display = 'block';
        if(sound) sound.style.display = 'none';
      } else if(sound) {
        sound.style.display = 'none';
      }

      modal.classList.add('show');
      if(p.video_url){
        video.play().catch(function(){});
      }
      document.body.style.overflow='hidden';
    });
}

function closeModal(){
  var modal = qs('#modal');
  var video = qs('#modalVideo');
  var image = qs('#modalImage');
  var sound = qs('#btnSound');
  modal.classList.remove('show');
  video.pause();
  video.removeAttribute('src');
  video.load();
  if(image){
    image.removeAttribute('src');
    image.style.display = 'none';
  }
  if(sound) sound.style.display = 'flex';
  document.body.style.overflow='';
}

function setReviewRating(value){
  var input = qs('#reviewRating');
  if(input) input.value = value;
  document.querySelectorAll('[data-rating]').forEach(function(button){
    button.classList.toggle('active', parseInt(button.getAttribute('data-rating'), 10) <= value);
  });
}

function openReviewsModal(){
  var modal = qs('#reviewsModal');
  if(!modal) return;
  setReviewRating(parseInt(qs('#reviewRating') ? qs('#reviewRating').value : '5', 10) || 5);
  modal.classList.add('show');
  document.body.style.overflow='hidden';
}

function closeReviewsModal(){
  var modal = qs('#reviewsModal');
  if(!modal) return;
  modal.classList.remove('show');
  document.body.style.overflow='';
}

/* ===== AR VIEWER ===== */
function openArViewer(modelUrl){
  var panel = document.getElementById('arViewer');
  var viewer = document.getElementById('arModelViewer');
  var placeBtn = document.getElementById('arPlaceBtn');

  // Reset
  placeBtn.disabled = true;
  placeBtn.classList.remove('ready');

  // Mostra o painel
  panel.classList.add('show');
  document.body.style.overflow = 'hidden';

  // Seta o modelo (comeca a carregar)
  viewer.setAttribute('src', modelUrl);

  // Quando carregar, ativa o botao
  viewer.addEventListener('load', function onLoad(){
    viewer.removeEventListener('load', onLoad);
    placeBtn.disabled = false;
    placeBtn.classList.add('ready');
  });
}

function closeArViewer(){
  var panel = document.getElementById('arViewer');
  var viewer = document.getElementById('arModelViewer');
  panel.classList.remove('show');
  viewer.removeAttribute('src');
  document.body.style.overflow = '';
}

function launchARFromViewer(){
  var viewer = document.getElementById('arModelViewer');
  if(viewer && viewer.canActivateAR){
    viewer.activateAR();
  }
}

/* Event listeners */
document.addEventListener('click', function(e){
  // Botao AR nos cards
  var arBtn = e.target.closest('.arBtn');
  if(arBtn){
    e.preventDefault();
    e.stopPropagation();
    var modelUrl = arBtn.getAttribute('data-ar-model');
    if(modelUrl){
      openArViewer(modelUrl);
    }
    return;
  }

  // Botao "Posicionar na mesa"
  if(e.target.closest('#arPlaceBtn')){
    e.preventDefault();
    e.stopPropagation();
    launchARFromViewer();
    return;
  }

  // Fechar AR viewer
  if(e.target.closest('#arViewerClose')){
    e.preventDefault();
    closeArViewer();
    return;
  }

  if(e.target.closest('[data-open-reviews]')){
    e.preventDefault();
    openReviewsModal();
    return;
  }

  if(e.target.closest('[data-close-reviews]') || e.target.id === 'reviewsModal'){
    e.preventDefault();
    closeReviewsModal();
    return;
  }

  var ratingBtn = e.target.closest('[data-rating]');
  if(ratingBtn){
    e.preventDefault();
    setReviewRating(parseInt(ratingBtn.getAttribute('data-rating'), 10));
    return;
  }

  var trackedLink = e.target.closest('[data-track-link]');
  if(trackedLink){
    trackMenuEvent({
      event_type: 'link_click',
      link_type: trackedLink.getAttribute('data-track-link') || 'other',
      link_label: trackedLink.getAttribute('data-track-label') || trackedLink.getAttribute('title') || trackedLink.getAttribute('aria-label') || 'Link'
    });
  }

  // Product card click
  var card = e.target.closest('[data-open-product]');
  if(card){
    openModalWithProduct(card.getAttribute('data-open-product'));
    return;
  }

  // Close video modal
  if(e.target.matches('[data-close-modal]')) closeModal();
  if(e.target.id === 'modal') closeModal();
}, true);

document.addEventListener('keydown', function(e){
  if(e.key === 'Escape'){
    closeModal();
    closeArViewer();
    closeReviewsModal();
  }
});

setReviewRating(5);
