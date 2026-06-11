export const restaurants = [
  {
    id: "r1",
    name: "Pizza Palazzo",
    cuisine: "Italian, Pizzas, Pasta",
    rating: 4.3,
    deliveryTime: "25-30 mins",
    minOrder: 199,
    discount: "50% OFF up to ₹100",
    gradient: "from-amber-400 to-red-500",
    image: "/images/pizza.png",
    address: "34, Khan Market, Rabindra Nagar, New Delhi, 110003",
    lat: 28.6298,
    lng: 77.2276,
    phone: "+91 98765 43210",
    openingHours: "11:00 AM - 11:00 PM",
    tags: ["Bestseller", "Family Friendly", "Quick Delivery"],
    reviews: [
      { name: "Arjun S.", rating: 5, text: "Best pizza in Delhi! The Margherita is absolutely authentic Italian taste.", date: "2024-12-15" },
      { name: "Priya M.", rating: 4, text: "Great taste and super quick delivery. Loved the garlic bread sticks!", date: "2024-11-28" },
      { name: "Rahul K.", rating: 4, text: "Consistent quality every single time. My go-to pizza place for weekends.", date: "2024-10-05" }
    ],
    menu: {
      starters: [
        { id: "r1-s1", name: "Garlic Bread Sticks", description: "Freshly baked garlic bread with cheesy dip", price: 129, image: "/images/pizza.png" },
        { id: "r1-s2", name: "Bruschetta", description: "Toasted bread topped with tomatoes, garlic, and olive oil", price: 149, image: "/images/pizza.png" }
      ],
      mains: [
        { id: "r1-m1", name: "Margherita Pizza", description: "Classic tomato sauce, mozzarella, and basil", price: 299, image: "/images/pizza.png" },
        { id: "r1-m2", name: "Farmhouse Pizza", description: "Onion, capsicum, tomato, and mushroom", price: 399, image: "/images/pizza.png" },
        { id: "r1-m3", name: "Alfredo Pasta", description: "Creamy white sauce pasta with broccoli and mushrooms", price: 279, image: "/images/pizza.png" }
      ],
      desserts: [
        { id: "r1-d1", name: "Choco Lava Cake", description: "Warm chocolate cake with a molten center", price: 99, image: "/images/desserts.png" },
        { id: "r1-d2", name: "Tiramisu", description: "Classic Italian coffee-flavoured dessert", price: 189, image: "/images/desserts.png" }
      ]
    }
  },
  {
    id: "r2",
    name: "Burger Bistro",
    cuisine: "Burgers, Fast Food, Beverages",
    rating: 4.5,
    deliveryTime: "15-20 mins",
    minOrder: 149,
    discount: "40% OFF up to ₹80",
    gradient: "from-yellow-400 to-orange-500",
    image: "/images/burger.png",
    address: "15, Linking Road, Bandra West, Mumbai, 400050",
    lat: 19.0596,
    lng: 72.8295,
    phone: "+91 98765 43211",
    openingHours: "10:00 AM - 12:00 AM",
    tags: ["Quick Delivery", "Popular", "Late Night"],
    reviews: [
      { name: "Sneha R.", rating: 5, text: "The Double Decker Burger is insane! Best burger joint in Bandra.", date: "2024-12-20" },
      { name: "Karan P.", rating: 4, text: "Cheese fries are addictive. Quick delivery even during peak hours.", date: "2024-11-10" },
      { name: "Ananya D.", rating: 5, text: "Spicy Paneer Burger is a must try for vegetarians. Absolutely delicious!", date: "2024-09-22" }
    ],
    menu: {
      starters: [
        { id: "r2-s1", name: "Cheese Fries", description: "Crispy fries smothered in warm cheese sauce", price: 119, image: "/images/burger.png" },
        { id: "r2-s2", name: "Onion Rings", description: "Golden fried crispy onion rings", price: 99, image: "/images/burger.png" }
      ],
      mains: [
        { id: "r2-m1", name: "Classic Cheese Burger", description: "Juicy beef/veg patty with cheddar and signature sauce", price: 179, image: "/images/burger.png" },
        { id: "r2-m2", name: "Double Decker Burger", description: "Double patties, double cheese, and fresh veggies", price: 249, image: "/images/burger.png" },
        { id: "r2-m3", name: "Spicy Paneer Burger", description: "Crispy paneer patty with spicy mayonnaise", price: 199, image: "/images/burger.png" }
      ],
      desserts: [
        { id: "r2-d1", name: "Apple Pie", description: "Warm flaky pastry filled with spiced apples", price: 129, image: "/images/desserts.png" },
        { id: "r2-d2", name: "Oreo Milkshake", description: "Creamy milkshake blended with Oreo cookies", price: 149, image: "/images/desserts.png" }
      ]
    }
  },
  {
    id: "r3",
    name: "Biryani Darbar",
    cuisine: "Biryani, Mughlai, North Indian",
    rating: 4.6,
    deliveryTime: "30-35 mins",
    minOrder: 249,
    discount: "₹100 OFF above ₹399",
    gradient: "from-amber-500 to-yellow-600",
    image: "/images/biryani.png",
    address: "8-2-293, Road No. 14, Banjara Hills, Hyderabad, 500034",
    lat: 17.4156,
    lng: 78.4347,
    phone: "+91 98765 43212",
    openingHours: "11:30 AM - 11:30 PM",
    tags: ["Bestseller", "Spicy", "Mughlai Special"],
    reviews: [
      { name: "Mohammed A.", rating: 5, text: "Authentic Hyderabadi biryani! The mutton biryani melts in your mouth.", date: "2024-12-18" },
      { name: "Lakshmi V.", rating: 5, text: "Butter chicken with naan is heavenly. Best Mughlai food in the city!", date: "2024-11-05" },
      { name: "Vikram S.", rating: 4, text: "Generous portions and rich flavors. Chicken tikka is perfectly spiced.", date: "2024-10-12" }
    ],
    menu: {
      starters: [
        { id: "r3-s1", name: "Chicken Tikka", description: "Spiced marinated chicken grilled in tandoor", price: 269, image: "/images/biryani.png" },
        { id: "r3-s2", name: "Paneer Tikka", description: "Cottage cheese cubes grilled with veggies", price: 229, image: "/images/biryani.png" }
      ],
      mains: [
        { id: "r3-m1", name: "Hyderabadi Chicken Biryani", description: "Fragrant basmati rice cooked with succulent chicken and spices", price: 349, image: "/images/biryani.png" },
        { id: "r3-m2", name: "Special Mutton Biryani", description: "Slow-cooked mutton biryani with aromatic spices", price: 429, image: "/images/biryani.png" },
        { id: "r3-m3", name: "Butter Chicken with Naan", description: "Rich creamy butter chicken served with butter naan", price: 319, image: "/images/biryani.png" }
      ],
      desserts: [
        { id: "r3-d1", name: "Gulab Jamun (2 Pcs)", description: "Soft fried dough balls soaked in sugar syrup", price: 69, image: "/images/desserts.png" },
        { id: "r3-d2", name: "Shahi Tukda", description: "Rich bread pudding with rabri and dry fruits", price: 119, image: "/images/desserts.png" }
      ]
    }
  },
  {
    id: "r4",
    name: "Sushi Sakura",
    cuisine: "Japanese, Sushi, Asian",
    rating: 4.7,
    deliveryTime: "35-40 mins",
    minOrder: 399,
    discount: "20% OFF up to ₹120",
    gradient: "from-rose-400 to-pink-600",
    image: "/images/sushi.png",
    address: "22, 100 Feet Road, Indiranagar, Bengaluru, 560038",
    lat: 12.9784,
    lng: 77.6408,
    phone: "+91 98765 43213",
    openingHours: "12:00 PM - 10:30 PM",
    tags: ["Premium", "Authentic Japanese", "Chef's Special"],
    reviews: [
      { name: "Deepa N.", rating: 5, text: "The salmon nigiri is incredibly fresh. Feels like dining in Tokyo!", date: "2024-12-22" },
      { name: "Rohan G.", rating: 5, text: "Mochi ice cream is divine. Best Japanese restaurant in Bangalore.", date: "2024-11-15" },
      { name: "Aisha K.", rating: 4, text: "California rolls are perfectly made. Great ambiance vibes too.", date: "2024-10-28" }
    ],
    menu: {
      starters: [
        { id: "r4-s1", name: "Edamame", description: "Steamed soybeans sprinkled with sea salt", price: 189, image: "/images/sushi.png" },
        { id: "r4-s2", name: "Gyoza (5 Pcs)", description: "Pan-fried vegetable or chicken dumplings", price: 249, image: "/images/sushi.png" }
      ],
      mains: [
        { id: "r4-m1", name: "California Roll", description: "Crab stick, avocado, cucumber, and orange tobiko", price: 450, image: "/images/sushi.png" },
        { id: "r4-m2", name: "Salmon Nigiri (4 Pcs)", description: "Fresh salmon slices over pressed sushi rice", price: 499, image: "/images/sushi.png" },
        { id: "r4-m3", name: "Vegetarian Maki Combo", description: "Assorted vegetarian sushi rolls", price: 399, image: "/images/sushi.png" }
      ],
      desserts: [
        { id: "r4-d1", name: "Matcha Ice Cream", description: "Authentic Japanese green tea ice cream", price: 129, image: "/images/desserts.png" },
        { id: "r4-d2", name: "Mochi Ice Cream (3 Pcs)", description: "Sweet pounded rice dough wrapping ice cream", price: 199, image: "/images/desserts.png" }
      ]
    }
  },
  {
    id: "r5",
    name: "The Healthy Bowl",
    cuisine: "Salads, Healthy Food, Juices",
    rating: 4.4,
    deliveryTime: "20-25 mins",
    minOrder: 199,
    discount: "30% OFF up to ₹75",
    gradient: "from-green-400 to-emerald-600",
    image: "/images/healthy.png",
    address: "12, Koregaon Park Road, Pune, 411001",
    lat: 18.5362,
    lng: 73.8936,
    phone: "+91 98765 43214",
    openingHours: "8:00 AM - 9:00 PM",
    tags: ["Pure Veg", "Organic", "Healthy", "Guilt-Free"],
    reviews: [
      { name: "Meera J.", rating: 5, text: "Finally healthy food that actually tastes amazing! Love the protein bowls.", date: "2024-12-10" },
      { name: "Siddharth B.", rating: 4, text: "Quinoa salad is super fresh. Great for post-workout meals.", date: "2024-11-20" },
      { name: "Nisha T.", rating: 4, text: "Chia seed pudding is delicious. Clean eating made easy!", date: "2024-10-08" }
    ],
    menu: {
      starters: [
        { id: "r5-s1", name: "Hummus & Pita", description: "Creamy hummus served with warm whole wheat pita", price: 159, image: "/images/healthy.png" },
        { id: "r5-s2", name: "Quinoa Salad", description: "Healthy salad with quinoa, cucumber, tomatoes, and lemon dressing", price: 189, image: "/images/healthy.png" }
      ],
      mains: [
        { id: "r5-m1", name: "Avocado Toast Bowl", description: "Mashed avocado, poached eggs, and cherry tomatoes on sourdough", price: 249, image: "/images/healthy.png" },
        { id: "r5-m2", name: "Grilled Chicken Protein Bowl", description: "Grilled chicken breast with brown rice and roasted broccoli", price: 299, image: "/images/healthy.png" },
        { id: "r5-m3", name: "Paneer Buddha Bowl", description: "Tofu/Paneer with quinoa, sweet potatoes, and tahini dressing", price: 279, image: "/images/healthy.png" }
      ],
      desserts: [
        { id: "r5-d1", name: "Chia Seed Pudding", description: "Coconut milk chia pudding topped with fresh berries", price: 139, image: "/images/desserts.png" },
        { id: "r5-d2", name: "Fresh Fruit Platter", description: "Seasonal sliced fresh fruits", price: 119, image: "/images/desserts.png" }
      ]
    }
  },
  {
    id: "r6",
    name: "Wok N Roll",
    cuisine: "Chinese, Noodles, Dim Sum",
    rating: 4.2,
    deliveryTime: "25-30 mins",
    minOrder: 179,
    discount: "50% OFF up to ₹100",
    gradient: "from-red-500 to-red-700",
    image: "/images/chinese.png",
    address: "6A, Park Street, Middleton Row, Kolkata, 700016",
    lat: 22.5553,
    lng: 88.3520,
    phone: "+91 98765 43215",
    openingHours: "11:00 AM - 11:00 PM",
    tags: ["Bestseller", "Spicy", "Value for Money"],
    reviews: [
      { name: "Debashish M.", rating: 4, text: "Hakka noodles remind me of street-side Chinese. So good and authentic!", date: "2024-12-08" },
      { name: "Ritu S.", rating: 5, text: "Dim sum is perfectly steamed. Best Chinese food in Kolkata's Park Street!", date: "2024-11-25" },
      { name: "Amit C.", rating: 4, text: "Manchurian gravy is loaded with flavor. Great portions for the price.", date: "2024-09-30" }
    ],
    menu: {
      starters: [
        { id: "r6-s1", name: "Spring Rolls (4 Pcs)", description: "Crispy rolls filled with shredded vegetables", price: 129, image: "/images/chinese.png" },
        { id: "r6-s2", name: "Veg Dim Sum (6 Pcs)", description: "Steamed vegetable dumplings served with spicy dip", price: 169, image: "/images/chinese.png" }
      ],
      mains: [
        { id: "r6-m1", name: "Hakka Noodles", description: "Wok-tossed noodles with colorful vegetables", price: 199, image: "/images/chinese.png" },
        { id: "r6-m2", name: "Schezwan Chicken", description: "Spicy chicken stir-fry with Schezwan peppers", price: 279, image: "/images/chinese.png" },
        { id: "r6-m3", name: "Manchurian Gravy", description: "Crispy veg balls in a savory soy-garlic gravy", price: 229, image: "/images/chinese.png" }
      ],
      desserts: [
        { id: "r6-d1", name: "Darsaan", description: "Crispy honey noodles served with vanilla ice cream", price: 139, image: "/images/desserts.png" }
      ]
    }
  },
  {
    id: "r7",
    name: "Dakshin Delight",
    cuisine: "South Indian, Dosa, Idli",
    rating: 4.5,
    deliveryTime: "15-20 mins",
    minOrder: 99,
    discount: "20% OFF above ₹199",
    gradient: "from-emerald-500 to-teal-600",
    image: "/images/south_indian.png",
    address: "28, Cathedral Road, Gopalapuram, Chennai, 600086",
    lat: 13.0340,
    lng: 80.2600,
    phone: "+91 98765 43216",
    openingHours: "7:00 AM - 10:00 PM",
    tags: ["Pure Veg", "Breakfast Special", "Authentic", "Budget Friendly"],
    reviews: [
      { name: "Suresh K.", rating: 5, text: "Masala dosa is crispy perfection! Authentic Chennai taste.", date: "2024-12-14" },
      { name: "Kavitha R.", rating: 5, text: "Best idli sambar in the city. Feels like home-cooked food.", date: "2024-11-18" },
      { name: "Ganesh P.", rating: 4, text: "Mysore masala dosa has the perfect spice level. Love it!", date: "2024-10-22" }
    ],
    menu: {
      starters: [
        { id: "r7-s1", name: "Medhu Vada (2 Pcs)", description: "Crispy deep-fried lentil donuts served with chutney & sambar", price: 69, image: "/images/south_indian.png" },
        { id: "r7-s2", name: "Idli (2 Pcs)", description: "Steamed fluffy rice cakes", price: 59, image: "/images/south_indian.png" }
      ],
      mains: [
        { id: "r7-m1", name: "Masala Dosa", description: "Crispy rice crepe filled with potato masala", price: 119, image: "/images/south_indian.png" },
        { id: "r7-m2", name: "Onion Rava Dosa", description: "Semolina crepe with onion toppings", price: 139, image: "/images/south_indian.png" },
        { id: "r7-m3", name: "Mysore Masala Dosa", description: "Spicy red chutney coated dosa with potato stuffing", price: 149, image: "/images/south_indian.png" }
      ],
      desserts: [
        { id: "r7-d1", name: "Rava Kesari", description: "Sweet semolina pudding flavoured with saffron and ghee", price: 79, image: "/images/desserts.png" }
      ]
    }
  },
  {
    id: "r8",
    name: "Sweet Treat Patisserie",
    cuisine: "Desserts, Bakery, Ice Cream",
    rating: 4.8,
    deliveryTime: "20-25 mins",
    minOrder: 149,
    discount: "30% OFF up to ₹120",
    gradient: "from-purple-400 to-pink-500",
    image: "/images/desserts.png",
    address: "B-14, MI Road, C Scheme, Jaipur, 302001",
    lat: 26.9157,
    lng: 75.8012,
    phone: "+91 98765 43217",
    openingHours: "10:00 AM - 10:00 PM",
    tags: ["Premium", "Must Try Desserts", "Instagrammable", "Gift Packs"],
    reviews: [
      { name: "Pooja L.", rating: 5, text: "The red velvet waffle is to die for! Best patisserie in Jaipur.", date: "2024-12-25" },
      { name: "Varun M.", rating: 5, text: "Chocolate truffle slice is pure indulgence. Amazing quality!", date: "2024-11-30" },
      { name: "Ishita G.", rating: 4, text: "Macarons are authentic French taste. Beautiful presentation too.", date: "2024-10-15" }
    ],
    menu: {
      starters: [
        { id: "r8-s1", name: "Macarons (3 Pcs)", description: "French almond cookies filled with chocolate ganache", price: 149, image: "/images/desserts.png" }
      ],
      mains: [
        { id: "r8-m1", name: "Red Velvet Waffle", description: "Fluffy red velvet waffle served with cream cheese", price: 199, image: "/images/desserts.png" },
        { id: "r8-m2", name: "Fudge Brownie Sundae", description: "Warm fudge brownie topped with vanilla ice cream and hot fudge", price: 219, image: "/images/desserts.png" },
        { id: "r8-m3", name: "Blueberry Cheesecake Slice", description: "Rich baked cheesecake with sweet blueberry topping", price: 249, image: "/images/desserts.png" }
      ],
      desserts: [
        { id: "r8-d1", name: "Vanilla Gelato Scoop", description: "Creamy vanilla Italian ice cream", price: 89, image: "/images/desserts.png" },
        { id: "r8-d2", name: "Chocolate Truffle Slice", description: "Rich layer cake with dark chocolate ganache", price: 179, image: "/images/desserts.png" }
      ]
    }
  }
];
