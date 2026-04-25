const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Product = require("../src/models/Product");
const Category = require('../src/models/Category');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const migrateProducts = async () => {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Đã kết nối thành công với MongoDB");
    try {
        // 1. Lấy tất cả danh mục (để tạo bản đồ Tên -> ID)
        const categories = await Category.find();
        const categoryMap = categories.reduce((map, cat) => {
            // Chuyển tên danh mục thành chữ hoa/thường nhất quán để so khớp
            map[cat.name.toLowerCase()] = cat._id; 
            return map;
        }, {});

        // 2. Lấy tất cả sản phẩm
        const products = await Product.find({}).lean(); // 👈 SỬA Ở ĐÂY: Dùng .lean() để lấy dữ liệu thô (plain JS objects)
let updatedCount = 0;

for (const product of products) {
    
    // Kiểm tra và bỏ qua nếu không phải là chuỗi hợp lệ
    if (typeof product.category !== 'string' || product.category.trim() === '') {
        console.warn(`Bỏ qua sản phẩm: ${product.name} (ID: ${product._id}) do trường 'category' không phải là chuỗi tên hợp lệ.`);
        continue; // Chuyển sang sản phẩm tiếp theo
    }

    // 🚨 Tiếp tục xử lý bằng tên danh mục
    const currentCategoryName = product.category.toLowerCase();
    const newCategoryId = categoryMap[currentCategoryName];

    if (newCategoryId) {
        // 3. Cập nhật trường 'category' từ Tên sang ID
        // Dùng Product.updateOne vì product là đối tượng lean (chỉ có dữ liệu)
        await Product.updateOne(
            { _id: product._id },
            // $set: Cập nhật trường category bằng ID mới (ObjectId)
            { $set: { category: newCategoryId } } 
        );
        updatedCount++;
    } else {
        console.warn(`Không tìm thấy ID trong Category Map cho tên: "${product.category}". Bỏ qua sản phẩm: ${product.name}`);
    }
}

        console.log(`✅ Hoàn thành di chuyển dữ liệu. Tổng số sản phẩm được cập nhật: ${updatedCount}`);
    } catch (error) {
        console.error('Lỗi trong quá trình di chuyển:', error.message);
    } finally {
        mongoose.connection.close();
        console.log('Kết nối database đã đóng.');
    }
};

migrateProducts();

// async function update() {
//   try {
//     await mongoose.connect(MONGODB_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log("✅ Đã kết nối thành công với MongoDB");

//     // Cập nhật tất cả sản phẩm: rate = 0, ratio = 0
//     const result = await Product.updateMany({}, { $set: { rate: 4.5, ratio: "1:24" } });

//     console.log(`Đã cập nhật ${result.modifiedCount} sản phẩm`);
//   } catch (err) {
//     console.error("Lỗi khi cập nhật rate & ratio:", err);
//   } finally {
//     await mongoose.disconnect();
//     process.exit();
//   }
// }

// update();

// async function getCategories() {
//   try {
//     await mongoose.connect(MONGODB_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log("✅ Đã kết nối thành công với MongoDB");

//     const categories = await Product.distinct('category');
//     console.log('Danh mục hiện có:', categories);
//     return categories;
//   } catch (error) {
//     console.error('Lỗi khi lấy danh mục:', error);
//   } finally {
//     mongoose.connection.close();
//   }
// }
// getCategories();

// async function syncCategories() {
//   try {
//     await mongoose.connect(MONGODB_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log("✅ Đã kết nối thành công với MongoDB");

//     // Lấy tất cả danh mục từ sản phẩm
//     const productCategories = await Product.distinct('category');
//     console.log('Danh mục từ sản phẩm:', productCategories);

//     // Kiểm tra và thêm vào Category
//     for (const categoryName of productCategories) {
//       const existingCategory = await Category.findOne({ name: categoryName });
//       if (!existingCategory) {
//         await Category.create({ name: categoryName });
//         console.log(`Đã thêm danh mục: ${categoryName}`);
//       } else {
//         console.log(`Danh mục ${categoryName} đã tồn tại, bỏ qua.`);
//       }
//     }

//     console.log('Đồng bộ danh mục hoàn tất!');
//   } catch (error) {
//     console.error('Lỗi khi đồng bộ danh mục:', error);
//   } finally {
//     mongoose.connection.close();
//   }
// }

// syncCategories();

// async function manageCategories() {
//   try {
//     await mongoose.connect(MONGODB_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log("✅ Đã kết nối thành công với MongoDB");

//     let categoriesToAdd = [];
//     if (yargs.argv.sync) {
//       // Đồng bộ từ sản phẩm
//       const productCategories = await Product.distinct("category");
//       console.log("Danh mục từ sản phẩm:", productCategories);
//       categoriesToAdd = productCategories.map((name) => ({
//         name,
//         description: `Danh mục ${name} được đồng bộ từ sản phẩm`,
//         image: "https://via.placeholder.com/150", // Hình ảnh mặc định
//       }));
//     } else if (yargs.argv.name) {
//       // Thêm danh mục mới thủ công
//       categoriesToAdd = [{
//         name: yargs.argv.name,
//         description: yargs.argv.description || "Mô tả mặc định",
//         image: yargs.argv.image || "https://via.placeholder.com/150",
//       }];
//     } else {
//       console.log("Vui lòng sử dụng --sync=true hoặc cung cấp --name để thêm danh mục.");
//       return;
//     }

//     // Thực hiện thêm hoặc cập nhật
//     for (const categoryData of categoriesToAdd) {
//       const existingCategory = await Category.findOne({ name: categoryData.name });
//       if (!existingCategory) {
//         await Category.create(categoryData);
//         console.log(`Đã thêm danh mục: ${categoryData.name}`);
//       } else {
//         console.log(`Danh mục ${categoryData.name} đã tồn tại, bỏ qua.`);
//       }
//     }

//     const finalCategoryCount = await Category.countDocuments();
//     console.log(`Đã quản lý thành công, tổng số danh mục: ${finalCategoryCount}`);
//   } catch (err) {
//     console.error("Lỗi khi quản lý danh mục:", err);
//   } finally {
//     await mongoose.disconnect();
//     console.log("✅ Đã ngắt kết nối với MongoDB");
//     process.exit();
//   }
// }

// manageCategories();