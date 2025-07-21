import axios from 'axios';
import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.min.css';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const form = document.querySelector('#search-form');
const input = document.querySelector('input[name="searchQuery"]');
const gallery = document.querySelector('.gallery');
const loader = document.querySelector('.loader');
const loadMoreBtn = document.querySelector('.load-more');
const endMessage = document.querySelector('.end-message');

const API_KEY = '51262986-c338856f457aa770ab0affaea';
const BASE_URL = 'https://pixabay.com/api/';

let currentPage = 1;
let currentQuery = '';
let totalHits = 0;

const lightbox = new SimpleLightbox('.gallery a');

function showLoader() {
  loader.style.display = 'block';
}
function hideLoader() {
  loader.style.display = 'none';
}
function clearGallery() {
  gallery.innerHTML = '';
}
function toggleLoadMore(show) {
  loadMoreBtn.style.display = show ? 'block' : 'none';
}
function showEndMessage(show) {
  endMessage.style.display = show ? 'block' : 'none';
}

function createMarkup(images) {
  return images
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => `
    <a href="${largeImageURL}" class="photo-card">
      <img src="${webformatURL}" alt="${tags}" loading="lazy" />
      <div class="info">
        <p><b>Likes:</b> ${likes}</p>
        <p><b>Views:</b> ${views}</p>
        <p><b>Comments:</b> ${comments}</p>
        <p><b>Downloads:</b> ${downloads}</p>
      </div>
    </a>
  `
    )
    .join('');
}

async function fetchImages(query, page = 1, perPage = 40) {
  const params = {
    key: API_KEY,
    q: query,
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: true,
    page,
    per_page: perPage,
  };

  const { data } = await axios.get(BASE_URL, { params });
  return data;
}

// 🔍 Form submit
form.addEventListener('submit', async e => {
  e.preventDefault();
  currentQuery = input.value.trim();
  if (!currentQuery) return;

  currentPage = 1;
  clearGallery();
  showLoader();
  toggleLoadMore(false);
  showEndMessage(false);

  try {
    const { hits, totalHits: total } = await fetchImages(
      currentQuery,
      currentPage
    );
    totalHits = total;

    if (hits.length === 0) {
      iziToast.warning({
        title: 'Oops!',
        message: 'No images found. Try a different keyword.',
      });
      return;
    }

    gallery.innerHTML = createMarkup(hits);
    lightbox.refresh();

    if (hits.length < 40 || hits.length >= totalHits) {
      toggleLoadMore(false);
      showEndMessage(true);
    } else {
      toggleLoadMore(true);
    }
  } catch (err) {
    iziToast.error({
      title: 'Error',
      message: 'Something went wrong while fetching images.',
    });
  } finally {
    hideLoader();
  }
});

// 🔁 Load More
loadMoreBtn.addEventListener('click', async () => {
  currentPage++;
  showLoader();
  toggleLoadMore(false);
  showEndMessage(false);

  try {
    const { hits } = await fetchImages(currentQuery, currentPage);

    gallery.insertAdjacentHTML('beforeend', createMarkup(hits));
    lightbox.refresh();
    smoothScroll();

    const loadedImages = currentPage * 40;
    if (loadedImages >= totalHits) {
      toggleLoadMore(false);
      showEndMessage(true);
    } else {
      toggleLoadMore(true);
    }
  } catch (err) {
    iziToast.error({
      title: 'Error',
      message: 'Failed to load more images.',
    });
  } finally {
    hideLoader();
  }
});

// 📜 Kaydırma
function smoothScroll() {
  const card = document.querySelector('.photo-card');
  if (card) {
    const { height } = card.getBoundingClientRect();
    window.scrollBy({
      top: height * 2,
      behavior: 'smooth',
    });
  }
}
