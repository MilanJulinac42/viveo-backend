import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { updateRequestStatusSchema, updateProfileSchema, updateAvailabilitySchema } from '../schemas/dashboard.schema.js';
import { createProductSchema, updateProductSchema, createVariantSchema, updateVariantSchema } from '../schemas/product.schema.js';
import { updateMerchOrderStatusSchema } from '../schemas/merch-order.schema.js';
import { createDigitalProductSchema, updateDigitalProductSchema } from '../schemas/digital-product.schema.js';
import { updateDigitalOrderStatusSchema } from '../schemas/digital-order.schema.js';
import { uploadLimiter, createLimiter } from '../middleware/rateLimiter.js';
import { videoUpload, imageUpload, digitalFileUpload, digitalPreviewUpload, avatarUpload } from '../middleware/upload.js';
import * as dashboardController from '../controllers/dashboard.controller.js';
import * as dashboardProductsController from '../controllers/dashboard-products.controller.js';
import * as dashboardDigitalController from '../controllers/dashboard-digital.controller.js';

const router = Router();

// Video requests (existing)
router.get('/requests', dashboardController.getRequests);
router.patch('/requests/:id', validate(updateRequestStatusSchema), dashboardController.updateRequestStatus);
router.post('/requests/:id/video', uploadLimiter, videoUpload, dashboardController.uploadVideo);
router.get('/earnings', dashboardController.getEarnings);
router.get('/availability', dashboardController.getAvailability);
router.patch('/availability', validate(updateAvailabilitySchema), dashboardController.updateAvailability);
router.patch('/profile', validate(updateProfileSchema), dashboardController.updateProfile);
router.post('/profile/avatar', uploadLimiter, avatarUpload, dashboardController.uploadAvatar);

// Product management (new)
router.get('/products', dashboardProductsController.getProducts);
router.post('/products', createLimiter, validate(createProductSchema), dashboardProductsController.createProduct);
router.get('/products/:id', dashboardProductsController.getProductById);
router.patch('/products/:id', validate(updateProductSchema), dashboardProductsController.updateProduct);
router.delete('/products/:id', dashboardProductsController.deleteProduct);
router.post('/products/:id/images', uploadLimiter, imageUpload, dashboardProductsController.uploadProductImages);
router.delete('/products/:id/images/:imageId', dashboardProductsController.deleteProductImage);
router.post('/products/:id/variants', validate(createVariantSchema), dashboardProductsController.addVariant);
router.patch('/products/:id/variants/:vid', validate(updateVariantSchema), dashboardProductsController.updateVariant);
router.delete('/products/:id/variants/:vid', dashboardProductsController.deleteVariant);

// Merch orders (new)
router.get('/merch-orders', dashboardProductsController.getMerchOrders);
router.patch('/merch-orders/:id', validate(updateMerchOrderStatusSchema), dashboardProductsController.updateMerchOrderStatus);
router.get('/merch-earnings', dashboardProductsController.getMerchEarnings);

// Digital product management
router.get('/digital-products', dashboardDigitalController.getDigitalProducts);
router.post('/digital-products', createLimiter, validate(createDigitalProductSchema), dashboardDigitalController.createDigitalProduct);
router.get('/digital-products/:id', dashboardDigitalController.getDigitalProductById);
router.patch('/digital-products/:id', validate(updateDigitalProductSchema), dashboardDigitalController.updateDigitalProduct);
router.delete('/digital-products/:id', dashboardDigitalController.deleteDigitalProduct);
router.post('/digital-products/:id/file', uploadLimiter, digitalFileUpload, dashboardDigitalController.uploadDigitalFile);
router.post('/digital-products/:id/preview', uploadLimiter, digitalPreviewUpload, dashboardDigitalController.uploadDigitalPreviewImage);

// Digital orders
router.get('/digital-orders', dashboardDigitalController.getDigitalOrders);
router.patch('/digital-orders/:id', validate(updateDigitalOrderStatusSchema), dashboardDigitalController.updateDigitalOrderStatus);
router.get('/digital-earnings', dashboardDigitalController.getDigitalEarnings);

export default router;
