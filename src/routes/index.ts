import { Router } from 'express';
import authRoutes from './auth.routes';
import patientRoutes from './patient.routes';
import appointmentRoutes from './appointment.routes';
import homeVisitRoutes from './homeVisit.routes';
import prenatalRoutes from './prenatal.routes';
import childcareRoutes from './childcare.routes';
import diabetesRoutes from './diabetes.routes';
import hypertensionRoutes from './hypertension.routes';
import sharedActionsRoutes from './sharedActions.routes';
import elderlyRoutes from './elderly.routes';
import womanHealthRoutes from './womanHealth.routes';
import managementRoutes from './management.routes';
import userRoutes from './user.routes';
import vaccineRoutes from './vaccine.routes';
import labExamRoutes from './labExam.routes';
import reportRoutes from './report.routes';
import dashboardRoutes from './dashboard.routes';
import notificationRoutes from './notification.routes';
import territorializationRoutes from './territorialization.routes';
import predictiveRoutes from './predictive.routes';
import telemedicineRoutes from './telemedicine.routes';
import geocodingRoutes from './geocoding.routes';
import syncRoutes from './sync.routes';

const router = Router();

// Rotas públicas
router.use('/auth', authRoutes);

// Rotas protegidas
router.use('/patients', patientRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/home-visits', homeVisitRoutes);
router.use('/prenatal', prenatalRoutes);
router.use('/childcare', childcareRoutes);
router.use('/diabetes', diabetesRoutes);
router.use('/hypertension', hypertensionRoutes);
router.use('/shared-actions', sharedActionsRoutes);
router.use('/elderly', elderlyRoutes);
router.use('/woman-health', womanHealthRoutes);
router.use('/vaccines', vaccineRoutes);
router.use('/lab-exams', labExamRoutes);
router.use('/reports', reportRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/territorialization', territorializationRoutes);
router.use('/predictive', predictiveRoutes);
router.use('/telemedicine', telemedicineRoutes);
router.use('/geocoding', geocodingRoutes);
router.use('/sync', syncRoutes);
router.use('/management', managementRoutes);
router.use('/users', userRoutes);

export default router;
