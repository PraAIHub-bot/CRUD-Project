import express from 'express'
const router = express.Router();
import studentController from '../controllers/studentController.js';

router.get('/', studentController.getAllDoc)
router.post('/', studentController.createDoc)
router.get('/edit/:id', studentController.editDoc)
router.post('/update/:id', studentController.updateDocById)
router.post('/delete/:id', studentController.deleteDocById)

// Lightweight connectivity probe consumed by public/js/script.js (TICKET-004).
router.get('/api/health', (req, res) => {
    res.json({ ok: true });
});

export default router;