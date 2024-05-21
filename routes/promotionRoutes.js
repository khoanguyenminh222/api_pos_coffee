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
            .populate('conditions.buy_get_free.buyItems.drink')
            .populate('conditions.buy_get_free.freeItems.drink')
            .populate('conditions.fixed_price.fixedPriceItems.category')
            .populate('conditions.buy_category_get_free.buyCategoryItems.category')
            .populate('conditions.buy_category_get_free.freeCategoryItems.drink');
        res.json(promotions);
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: error.message });
    }
});

// API endpoint để thêm một Promotion mới
router.post('/', authenticateJWT, async (req, res) => {
    try {
        // Extract promotion details from request body
        const { name, description, type, conditions, startDate, endDate, isActive } = req.body;
        // Create a new promotion object based on promotion type
        let newPromotion;
        switch (type) {
            case 'buy_get_free':
                newPromotion = new Promotion({
                    name,
                    description,
                    type,
                    conditions,
                    startDate,
                    endDate,
                    isActive
                });
                await newPromotion.save();
                await Drink.updateMany(
                    { _id: { $in: newPromotion.conditions.buy_get_free.buyItems.map(item => item.drink) } },
                    { $push: { promotions: newPromotion._id } }
                );
                break;
            case 'discount':
                
                newPromotion = new Promotion({
                    name,
                    description,
                    type,
                    conditions,
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
                    conditions,
                    startDate,
                    endDate,
                    isActive
                });
                await newPromotion.save();
                // Update reference to the new promotion in drinks
                await Drink.updateMany(
                    { categoryId: { $in: newPromotion.conditions.fixed_price.fixedPriceItems.map(item => item.category) } },
                    { $push: { promotions: newPromotion._id } }
                );
                
                break;
            case 'buy_category_get_free':
                newPromotion = new Promotion({
                    name,
                    description,
                    type,
                    conditions,
                    startDate,
                    endDate,
                    isActive
                });
                await newPromotion.save();
                // Update reference to the new promotion in drinks
                await Drink.updateMany(
                    { categoryId: { $in: newPromotion.conditions.buy_category_get_free.buyCategoryItems.map(item => item.category) } },
                    { $push: { promotions: newPromotion._id } }
                );
                break;
            default:
                return res.status(400).json({ message: 'Invalid promotion type' });
        }
        // Return success response
        res.status(201).json({ message: 'Khuyến mãi được thêm thành công', promotion: newPromotion });
    } catch (error) {
        // Handle errors
        console.error('Error adding promotion:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.put('/setActive/:id', authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const promotion = await Promotion.findById(id);
        if (!promotion) {
            return res.status(404).json({ message: 'Promotion not found' });
        }
        await Promotion.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true });
        res.status(200).json({ message: 'Đã chuyển đổi trạng thái' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

})
// API endpoint để sửa thông tin một Promotion
router.put('/:id', authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const promotion = await Promotion.findById(id);

        if (!promotion) {
            return res.status(404).json({ message: 'Promotion not found' });
        }
        switch (req.body.type) {
            case 'buy_get_free':
                let updatedPromotionBuyGetFree = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true });
                // Remove reference to the old promotion from drinks
                await Drink.updateMany(
                    { _id: { $in: promotion.conditions.buy_get_free.buyItems.map(item => item.drink) } },
                    { $pull: { promotions: promotion._id } }
                );

                // Update reference to the new promotion in drinks
                await Drink.updateMany(
                    { _id: { $in: req.body.conditions.buy_get_free.buyItems.map(item => item.drink) } },
                    { $push: { promotions: promotion._id } }
                );
                res.status(200).json({ message: "Khuyến mãi 'Mua hàng được tặng' được cập nhật", updatedPromotionBuyGetFree });
                break;
            case 'buy_category_get_free':
                let updatedPromotionBuyCategoryGetFree = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true });
                // Remove reference to the old promotion from drinks
                await Drink.updateMany(
                    { categoryId: { $in: promotion.conditions.buy_category_get_free.buyCategoryItems.map(item => item.category) } },
                    { $pull: { promotions: promotion._id } }
                );

                // Update reference to the new promotion in drinks
                await Drink.updateMany(
                    { categoryId: { $in: req.body.conditions.buy_category_get_free.buyCategoryItems.map(item => item.category) } },
                    { $push: { promotions: promotion._id } }
                );
                res.status(200).json({ message: "Khuyến mãi 'Mua theo loại đồ uống được tặng' được cập nhật", updatedPromotionBuyCategoryGetFree });
                break;
            case 'fixed_price':
                let updatedPromotionFixedPrice = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true });
                // Remove reference to the old promotion from drinks
                await Drink.updateMany(
                    { categoryId: { $in: promotion.conditions.fixed_price.fixedPriceItems.map(item => item.category) } },
                    { $pull: { promotions: promotion._id } }
                );

                // Update reference to the new promotion in drinks
                await Drink.updateMany(
                    { categoryId: { $in: req.body.conditions.fixed_price.fixedPriceItems.map(item => item.category) } },
                    { $push: { promotions: promotion._id } }
                );
                res.status(200).json({ message: "Khuyến mãi 'Đồng giá' được cập nhật", updatedPromotionFixedPrice });
                break;
            default:
                break;
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
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
        res.status(201).json({ message: 'Khuyến mãi đã được xoá' });
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
        const foundDrinks = await Drink.find({ _id: { $in: drinkIds } })

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

async function checkPromotionConditions(promotionId, drinkId, foundDrinks, categoryId, quantity) {
    try {
        const promotion = await Promotion.findById(promotionId)
        .populate('conditions.buy_get_free.buyItems.drink')
            .populate('conditions.buy_get_free.freeItems.drink')
            .populate('conditions.buy_category_get_free.buyCategoryItems.category')
            .populate('conditions.buy_category_get_free.freeCategoryItems.drink');
        if (!promotion) {
            return null; // Không tìm thấy chương trình khuyến mãi
        }
        // Kiểm tra các điều kiện tương ứng với loại chương trình khuyến mãi
        switch (promotion.type) {
            case 'buy_get_free':
                const buyItems = promotion.conditions.buy_get_free.buyItems;
                console.log(buyItems)
                // Tính tổng số lượng yêu cầu của tất cả các sản phẩm trong buyItems
                const totalRequiredQuantityBuyGetFree = buyItems.reduce((total, item) => total + item.quantity, 0);

                // Tính tổng số lượng của các sản phẩm được mua có trong danh sách buyItems
                const totalQuantityBought = buyItems.reduce((total, item) => {
                    const drink = foundDrinks.find(drink => drink._id.equals(item.drink._id));
                    if (drink) {
                        total += drink.quantity;
                    }
                    return total;
                }, 0);

                // Kiểm tra nếu bất kỳ sản phẩm nào trong foundDrinks có số lượng đủ để đáp ứng tổng số lượng của buyItems
                const isQualifiedBuyGetFree = foundDrinks.some(drink => buyItems.some(item => drink._id.equals(item.drink._id) && drink.quantity >= totalRequiredQuantityBuyGetFree));

                // Kiểm tra nếu tổng số lượng các sản phẩm mua đạt yêu cầu
                if (totalQuantityBought >= totalRequiredQuantityBuyGetFree || isQualifiedBuyGetFree) {
                    return promotion;
                }

                return null;
            case 'discount':
                // Kiểm tra các điều kiện khác tùy thuộc vào loại chương trình khuyến mãi
                break;
            case 'fixed_price':
                // Kiểm tra các điều kiện khác tùy thuộc vào loại chương trình khuyến mãi
                break;
            case 'buy_category_get_free':
                // Kiểm tra số lượng sản phẩm mua và danh mục đủ điều kiện để nhận sản phẩm miễn phí
                const buyCategoryItems = promotion.conditions.buy_category_get_free.buyCategoryItems;
                const categoryItem = buyCategoryItems.find(item => item.category._id.toString() === categoryId.toString());

                if (!categoryItem) {
                    return null;
                }

                const requiredQuantityBuyCategory = categoryItem.quantity;
                // Biến để kiểm tra xem đã có ít nhất một sản phẩm đủ điều kiện hay chưa
                let isAnyDrinkQualifiedBuyCategory = false;

                // Tính tổng số lượng đồ uống trong cùng một danh mục
                const totalQuantityInCategory = foundDrinks.reduce((total, drink) => {
                    if (drink.categoryId.equals(categoryId)) {
                        total += drink.quantity;
                        // Kiểm tra xem sản phẩm có đủ điều kiện không
                        if (drink.quantity >= requiredQuantityBuyCategory) {
                            isAnyDrinkQualifiedBuyCategory = true;
                        }
                    }
                    return total;
                }, 0);

                // Kiểm tra xem có ít nhất một sản phẩm đủ điều kiện hoặc tổng số lượng đủ điều kiện để nhận sản phẩm miễn phí
                if (totalQuantityInCategory >= requiredQuantityBuyCategory || isAnyDrinkQualifiedBuyCategory) {
                    return promotion;
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
