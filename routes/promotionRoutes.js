// Import các thư viện cần thiết và Promotion model
const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authenticateJWT');
const Promotion = require('../models/Promotion');
const Drink = require('../models/Drink');

// API endpoint để lấy tất cả các Promotion
router.get('/', authenticateJWT, async (req, res) => {
    try {
        const promotions = await Promotion.find()
            .populate('buyItems.drink')
            .populate('freeItem.drink')
            .populate('fixedPriceItems.drink')
            .populate('buyCategoryItems.category')
            .populate('freeCategoryItems.category')
        res.json(promotions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// API endpoint để thêm một Promotion mới
router.post('/', authenticateJWT, async (req, res) => {
    try {
        // Extract promotion details from request body
        const { name, description, type, buyItems, freeItem, discountPercent, fixedPriceItems, buyCategoryItems, freeCategoryItems, startDate, endDate, isActive } = req.body;
        console.log(req.body.type)
        // Create a new promotion object based on promotion type
        let newPromotion;
        switch (type) {
            case 'buy_get_free':
                newPromotion = new Promotion({
                    name,
                    description,
                    type,
                    buyItems,
                    freeItem,
                    startDate,
                    endDate,
                    isActive
                });
                await newPromotion.save();
                break;
            case 'discount':
                newPromotion = new Promotion({
                    name,
                    description,
                    type,
                    discountPercent,
                    startDate,
                    endDate,
                    isActive
                });
                await newPromotion.save();
                break;
            case 'fixed_price':
                newPromotion = new Promotion({
                    name,
                    description,
                    type,
                    fixedPriceItems,
                    startDate,
                    endDate,
                    isActive
                });
                await newPromotion.save();
                break;
            case 'buy_category_get_free':
                newPromotion = new Promotion({
                    name,
                    description,
                    type,
                    buyCategoryItems,
                    freeCategoryItems,
                    startDate,
                    endDate,
                    isActive
                });
                await newPromotion.save();
                await Drink.updateMany({ categoryId: buyCategoryItems.category }, { $push: { promotions: newPromotion._id } });
                break;
            default:
                return res.status(400).json({ error: 'Invalid promotion type' });
        }
        // Return success response
        res.status(201).json({ message: 'Promotion added successfully', promotion: newPromotion });
    } catch (error) {
        // Handle errors
        console.error('Error adding promotion:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint để sửa thông tin một Promotion
router.put('/:id', authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const promotion = await Promotion.findById(id);

        if (!promotion) {
            return res.status(404).json({ error: 'Promotion not found' });
        }
        switch (req.body.type) {
            case 'buy_category_get_free':
                let updatedPromotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true });
                // Remove reference to the old promotion from drinks
                await Drink.updateMany({ categoryId: promotion.buyCategoryItems.category }, { $pull: { promotions: promotion._id } });

                // Update reference to the new promotion in drinks
                await Drink.updateMany({ categoryId: promotion.buyCategoryItems.category }, { $push: { promotions: promotion._id } });
                res.status(200).json({ message: 'Promotion buy_category_get_free updated successfully', updatedPromotion });
                break;
            default:
                break;
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// API endpoint để xoá một Promotion
router.delete('/:id', authenticateJWT, async (req, res) => {
    try {
        const deletedPromotion = await Promotion.findByIdAndDelete(req.params.id);
        if (!deletedPromotion) {
            throw new Error('Promotion not found');
        }
        await Drink.updateMany(
            { 'promotions._id': req.params.id }, // Filter to find drinks with the promotion
            { $pull: { promotions: { _id: req.params.id } } } // Pull the promotion from the array
        );
        console.log('Promotion deleted successfully and removed from drinks.');
        res.status(201).json({ message: 'Promotion deleted successfully' });
    } catch (error) {
        console.error('Error deleting promotion:', error.message);
        res.status(500).json({ message: error.message });
    }
});

router.post('/check-promotion', authenticateJWT, async (req, res) => {
    try {
        const drinks = req.body.drinks; // Giả sử req.body chứa một mảng các đồ uống
        // Khai báo một mảng để chứa các drinkId
        const drinkIds = drinks.map(drink => drink.id);

        // Tìm kiếm các drink trong schema của Drink dựa trên danh sách drinkIds
        const foundDrinks = await Drink.find({ _id: { $in: drinkIds } });

        // Gán thuộc tính quantity từ mảng drinks vào foundDrinks
        for (const foundDrink of foundDrinks) {
            const matchingDrink = drinks.find(drink => String(drink.id) === String(foundDrink._id));
            if (matchingDrink) {
                foundDrink.quantity = matchingDrink.quantity;
            }
        }
        // Kiểm tra xem có bất kỳ đồ uống nào có chương trình khuyến mãi hay không
        const drinksWithPromotion = foundDrinks.filter(drink => drink.promotions);
        if (drinksWithPromotion.length === 0) {
            res.status(200).json({ message: 'Không có đồ uống nào có chương trình khuyến mãi.' });
            return;
        }

        // Kiểm tra điều kiện chương trình khuyến mãi cho từng đồ uống có chương trình
        const promotions = [];
        for (const drink of foundDrinks) {
            if (drink.promotions && drink.promotions.length > 0) {
                for (const promotion of drink.promotions) {
                    const qualifiedPromotion = await checkPromotionConditions(promotion, drink._id, foundDrinks, drink.categoryId, drink.quantity);
                    if (qualifiedPromotion && !promotions.some(existingPromotion => existingPromotion.promotion._id.equals(qualifiedPromotion._id))) {
                        promotions.push({ promotion: qualifiedPromotion });
                    }
                }
            }
        }

        res.status(200).json({ promotions });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi xử lý yêu cầu.' });
    }
})

async function checkPromotionConditions(promotionId, drinkId, drinks, categoryId, quantity) {
    try {
        const promotion = await Promotion.findById(promotionId);
        if (!promotion) {
            return null; // Không tìm thấy chương trình khuyến mãi
        }

        // Kiểm tra các điều kiện tương ứng với loại chương trình khuyến mãi
        switch (promotion.type) {
            case 'buy_get_free':
                // Kiểm tra số lượng sản phẩm mua đủ điều kiện để nhận sản phẩm miễn phí
                const buyItem = promotion.buyItems.find(item => item.drink.toString() === drinkId);
                if (!buyItem || quantity < buyItem.quantity) {
                    return null;
                }
                return promotion;
            case 'discount':
                // Kiểm tra các điều kiện khác tùy thuộc vào loại chương trình khuyến mãi
                break;
            case 'fixed_price':
                // Kiểm tra các điều kiện khác tùy thuộc vào loại chương trình khuyến mãi
                break;
            case 'buy_category_get_free':
                // Kiểm tra số lượng sản phẩm mua và danh mục đủ điều kiện để nhận sản phẩm miễn phí
                if (categoryId && promotion.buyCategoryItems.category.equals(categoryId)) {
                    const buyCategoryItem = promotion.buyCategoryItems;
                    const requiredQuantity = buyCategoryItem.quantity;

                    // Biến để kiểm tra xem đã có ít nhất một sản phẩm đủ điều kiện hay chưa
                    let isAnyDrinkQualified = false;

                    // Tính tổng số lượng đồ uống trong cùng một danh mục
                    const totalQuantityInCategory = drinks.reduce((total, drink) => {
                        if (drink.categoryId.equals(categoryId)) {
                            total += drink.quantity;
                            // Kiểm tra xem sản phẩm có đủ điều kiện không
                            if (drink.quantity >= requiredQuantity) {
                                isAnyDrinkQualified = true;
                            }
                        }
                        return total;
                    }, 0);
                    console.log(totalQuantityInCategory)
                    // Kiểm tra xem có ít nhất một sản phẩm đủ điều kiện hoặc tổng số lượng đủ điều kiện để nhận sản phẩm miễn phí
                    if (totalQuantityInCategory >= requiredQuantity || isAnyDrinkQualified) {
                        return promotion;
                    }
                }
                return null;
            default:
                return null; // Loại chương trình khuyến mãi không hợp lệ
        }
    } catch (error) {
        console.error(error);
        return null;
    }
}

module.exports = router;