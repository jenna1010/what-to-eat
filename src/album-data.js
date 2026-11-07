const albumCategories = ["早午餐", "飯麵", "甜點"];

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
      photo: "assets/forno-stufa-vodka-rigatoni.jpg",
      alt: "白盤中的伏特加粉紅醬水管麵，麵上撒著起司",
      visitId: "forno-stufa-vodka-rigatoni-01",
      score: 3.5,
      reviews: {
        me: "麵的軟硬度很剛好，醬汁處理得很好吃，也不會有太重的酒味，起司的量適中，不會過膩，但份量偏少，吃不飽",
        partner: "太貴太少"
      }
    }]
  }
];
