const albumCategories = ["早午餐", "飯麵", "甜點", "小吃"];

const albumRestaurants = [
  {
    id: "john-doe-cafe",
    name: "無名氏咖啡",
    englishName: "JOHN DOE CAFÉ",
    city: "臺北市",
    district: "文山區",
    address: "116臺北市文山區萬祥里羅斯福路五段225號",
    dishes: [{
      id: "chicken-sandwich",
      name: "雞肉蛋沙拉總匯",
      categories: ["早午餐"],
      price: 280,
      photo: "assets/john-doe-cafe-chicken-sandwich.jpg",
      alt: "雞肉蛋沙拉總匯、德式香腸、玉米筍與撒上爆米花的燕麥奶",
      visitId: "john-doe-cafe-chicken-sandwich-01",
      score: 4,
      reviews: {
        me: "溫沙拉的玉米筍好吃，德式香腸也很脆，雞肉沙拉總匯有抹花生醬，恰到好處不會膩，燕麥奶很好喝，裡面的香蕉是水果，不喜歡可以不加，有加爆米花和ORZO，完全不奇怪！吃的很飽，非常滿足～～",
        partner: "澱粉大餐"
      }
    }, {
      id: "brown-sugar-cheesecake",
      name: "炙燒黑糖重乳酪",
      categories: ["甜點"],
      price: 130,
      photo: "assets/john-doe-cafe-brown-sugar-cheesecake.jpg",
      alt: "前景的炙燒黑糖重乳酪，表面有炙燒過的糖粒",
      visitId: "john-doe-cafe-brown-sugar-cheesecake-01",
      score: 3.5,
      reviews: {
        me: "",
        partner: ""
      }
    }, {
      id: "basque-cheesecake",
      name: "原味巴斯克乳酪",
      categories: ["甜點"],
      price: 130,
      photo: "assets/john-doe-cafe-basque-cheesecake.jpg?v=c0d35502ea61",
      alt: "黑盤上單獨一片原味巴斯克乳酪，表面平滑呈金棕色",
      visitId: "john-doe-cafe-basque-cheesecake-01",
      score: 3,
      reviews: {
        me: "",
        partner: ""
      }
    }]
  },
  {
    id: "forno-stufa",
    name: "爐子煮賣所",
    englishName: "Forno & Stufa",
    city: "臺北市",
    district: "文山區",
    address: "116臺北市文山區萬和里汀州路四段132號1樓",
    dishes: [{
      id: "vodka-rigatoni",
      name: "伏特加粉紅醬水管麵",
      categories: ["飯麵"],
      price: 350,
      photo: "assets/forno-stufa-vodka-rigatoni.jpg?v=704e8d27e973",
      alt: "白盤中的伏特加粉紅醬水管麵，麵上撒著起司",
      visitId: "forno-stufa-vodka-rigatoni-01",
      score: 3.5,
      reviews: {
        me: "麵的軟硬度很剛好，醬汁處理得很好吃，也不會有太重的酒味，起司的量適中，不會過膩，但份量偏少，吃不飽",
        partner: "太貴太少"
      }
    }, {
      id: "sea-prawn-noodle-soup",
      name: "南洋風味蝦湯麵",
      categories: ["飯麵"],
      price: 350,
      photo: "assets/forno-stufa-sea-prawn-noodle-soup.jpg?v=824e497c0549",
      alt: "碗裡的南洋風味蝦湯麵，上面有蝦和青菜",
      visitId: "forno-stufa-sea-prawn-noodle-soup-01",
      score: 4,
      reviews: {
        me: "",
        partner: ""
      }
    }]
  },
  {
    id: "yue-lai-yue-pho",
    name: "越來越PHO 越南河粉",
    englishName: "",
    city: "臺北市",
    district: "文山區",
    address: "116臺北市文山區萬祥里羅斯福路五段281號",
    dishes: [{
      id: "beef-belly-pho",
      name: "牛五花河粉",
      categories: ["飯麵"],
      price: 140,
      photo: "assets/yue-lai-yue-pho-beef-belly-pho.jpg?v=e8027fb6d81e",
      alt: "牛五花河粉與分開盛裝的香草和檸檬汁",
      visitId: "yue-lai-yue-pho-beef-belly-pho-01",
      score: 4.5,
      reviews: {
        me: "有洋蔥跟蔥，下次可以請他不要加，辣味跟酸味都可以自行調整，但一次 ALL IN 檸檬汁有點太酸，可惜沒有豬肉。",
        partner: "好吃，便宜，先吃原味，檸檬汁加一點即可"
      }
    }, {
      id: "crispy-spring-rolls",
      name: "香脆手工炸春捲",
      categories: ["小吃"],
      price: 80,
      photo: "assets/yue-lai-yue-pho-crispy-spring-rolls.jpg",
      alt: "白盤裡的兩條炸春捲，旁邊附一小碟沾醬",
      visitId: "yue-lai-yue-pho-crispy-spring-rolls-01",
      score: 3,
      reviews: {
        me: "好吃，是豬肉的",
        partner: "太貴，不要點"
      }
    }]
  }
];
