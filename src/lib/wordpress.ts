// WordPress REST API Configuration
// Update this URL to point to your WordPress installation
export const WORDPRESS_API_URL = "https://your-wordpress-site.com/wp-json/wp/v2";

export interface WordPressPost {
  id: number;
  date: string;
  slug: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  featured_media: number;
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url: string;
      alt_text: string;
    }>;
  };
}

export interface WordPressPage {
  id: number;
  date: string;
  slug: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
}

export interface WordPressProduct {
  id: number;
  date: string;
  slug: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  featured_media: number;
  product_meta: {
    price: string;
    original_price: string;
    stock: string;
    badge: string;
    is_active: string;
  };
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url: string;
      alt_text: string;
    }>;
    "wp:term"?: Array<Array<{
      id: number;
      name: string;
      slug: string;
    }>>;
  };
}

export const fetchWordPressPosts = async (page = 1, perPage = 10): Promise<WordPressPost[]> => {
  const response = await fetch(
    `${WORDPRESS_API_URL}/posts?page=${page}&per_page=${perPage}&_embed`
  );
  
  if (!response.ok) {
    throw new Error("Failed to fetch WordPress posts");
  }
  
  return response.json();
};

export const fetchWordPressPost = async (slug: string): Promise<WordPressPost> => {
  const response = await fetch(
    `${WORDPRESS_API_URL}/posts?slug=${slug}&_embed`
  );
  
  if (!response.ok) {
    throw new Error("Failed to fetch WordPress post");
  }
  
  const posts = await response.json();
  if (posts.length === 0) {
    throw new Error("Post not found");
  }
  
  return posts[0];
};

export const fetchWordPressPages = async (): Promise<WordPressPage[]> => {
  const response = await fetch(`${WORDPRESS_API_URL}/pages`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch WordPress pages");
  }
  
  return response.json();
};

export const fetchWordPressPage = async (slug: string): Promise<WordPressPage> => {
  const response = await fetch(`${WORDPRESS_API_URL}/pages?slug=${slug}`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch WordPress page");
  }
  
  const pages = await response.json();
  if (pages.length === 0) {
    throw new Error("Page not found");
  }
  
  return pages[0];
};

export const fetchWordPressProducts = async (
  page = 1, 
  perPage = 12,
  category?: string
): Promise<WordPressProduct[]> => {
  let url = `${WORDPRESS_API_URL}/lujo-products?page=${page}&per_page=${perPage}&_embed`;
  
  if (category) {
    url += `&lujo_product_category=${category}`;
  }
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error("Failed to fetch WordPress products");
  }
  
  const products = await response.json();
  
  // Filter to only active products
  return products.filter((p: WordPressProduct) => p.product_meta?.is_active === '1');
};

export const fetchWordPressProduct = async (slug: string): Promise<WordPressProduct> => {
  const response = await fetch(
    `${WORDPRESS_API_URL}/lujo-products?slug=${slug}&_embed`
  );
  
  if (!response.ok) {
    throw new Error("Failed to fetch WordPress product");
  }
  
  const products = await response.json();
  if (products.length === 0) {
    throw new Error("Product not found");
  }
  
  return products[0];
};

export const fetchWordPressProductCategories = async () => {
  const response = await fetch(`${WORDPRESS_API_URL}/lujo_product_category`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch product categories");
  }
  
  return response.json();
};
