"""
Doomsday Sentinel — Django REST API Integration Test Suite
Validates health, model info, real image inference, video inference,
database persistence, statistics, and PDF report generation.
"""

import os
import sys
import io
import pytest
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from PIL import Image

from apps.forensics.models import Analysis, AnalysisArtifact


class ForensicsAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_01_health_endpoint(self):
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("status", data)
        self.assertIn("torch_version", data)
        self.assertIn("model_version", data)
        self.assertTrue(data["database"]["connected"])

    def test_02_model_info_endpoint(self):
        response = self.client.get('/api/model/info/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["architecture"], "efficientnet_b0")
        self.assertIn("decision_threshold", data)
        self.assertEqual(data["labels"], {"0": "REAL", "1": "FAKE"})

    def test_03_analyze_image_endpoint(self):
        # Create synthetic test image
        img = Image.new('RGB', (256, 256), color=(120, 150, 180))
        img_io = io.BytesIO()
        img.save(img_io, format='JPEG')
        img_io.seek(0)
        img_io.name = "test_sample.jpg"

        response = self.client.post('/api/analyze/image/', {'image': img_io}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertIn("prediction", data)
        self.assertIn("score", data)
        self.assertIn("confidence", data)
        self.assertIn("explanation_image", data)
        self.assertEqual(data["media_type"], "image")

        # Verify DB persistence
        analysis = Analysis.objects.get(id=data["id"])
        self.assertEqual(analysis.prediction, data["prediction"])
        self.assertTrue(analysis.artifacts.filter(artifact_type='input_media').exists())

    def test_04_analyze_video_endpoint(self):
        # Check if sample video exists in data/raw/videos
        vid_path = "data/raw/videos/fake_vid_ID_000.mp4"
        if not os.path.exists(vid_path):
            self.skipTest("Sample video file not found")

        with open(vid_path, "rb") as vid_file:
            response = self.client.post('/api/analyze/video/', {'video': vid_file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data["media_type"], "video")
        self.assertIn("frame_statistics", data)
        self.assertIn("score", data)

    def test_05_analyses_list_and_detail(self):
        # Create sample analysis record
        analysis = Analysis.objects.create(
            media_type="image",
            original_filename="sample.png",
            prediction="FAKE",
            score=0.95,
            confidence=0.95,
            threshold=0.50,
            model_version="v1.0"
        )

        # List
        resp_list = self.client.get('/api/analyses/')
        self.assertEqual(resp_list.status_code, status.HTTP_200_OK)
        results = resp_list.json()["results"]
        self.assertTrue(any(r["id"] == str(analysis.id) for r in results))

        # Detail
        resp_det = self.client.get(f'/api/analyses/{analysis.id}/')
        self.assertEqual(resp_det.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_det.json()["prediction"], "FAKE")

    def test_06_dashboard_stats(self):
        response = self.client.get('/api/dashboard/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("total_analyses", data)
        self.assertIn("real_count", data)
        self.assertIn("fake_count", data)

    def test_07_download_pdf_report(self):
        analysis = Analysis.objects.create(
            media_type="image",
            original_filename="report_test.jpg",
            prediction="REAL",
            score=0.02,
            confidence=0.98,
            threshold=0.50,
            model_version="v1.0"
        )
        response = self.client.get(f'/api/reports/{analysis.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertTrue(len(response.content) > 1000)

    def test_08_invalid_file_rejection(self):
        text_io = io.BytesIO(b"Not an image")
        text_io.name = "malicious.txt"
        response = self.client.post('/api/analyze/image/', {'image': text_io}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_09_admin_authentication(self):
        from django.contrib.auth.models import User
        User.objects.create_superuser('testadmin', 'test@sentinel.ai', 'SecretTestPass123!')

        # Invalid password
        bad_resp = self.client.post('/api/auth/login/', {'username': 'testadmin', 'password': 'wrong'}, format='json')
        self.assertEqual(bad_resp.status_code, status.HTTP_401_UNAUTHORIZED)

        # Valid login
        good_resp = self.client.post('/api/auth/login/', {'username': 'testadmin', 'password': 'SecretTestPass123!'}, format='json')
        self.assertEqual(good_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(good_resp.json()['status'], 'authenticated')
        self.assertIn('token', good_resp.json())

    def test_10_admin_system_stats(self):
        response = self.client.get('/api/admin/system-stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('gpu', data)
        self.assertIn('database', data)
        self.assertIn('runtime', data)
        self.assertIn('total_analyses', data['database'])

    def test_11_admin_threshold_calibration(self):
        response = self.client.post('/api/admin/set-threshold/', {'threshold': 0.25}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['decision_threshold'], 0.25)
        
        # Reset back to 0.50
        self.client.post('/api/admin/set-threshold/', {'threshold': 0.50}, format='json')

    def test_12_user_provisioning_and_login_lifecycle(self):
        from django.contrib.auth.models import User

        # 1. Admin provisions user with is_active=False
        create_resp = self.client.post('/api/admin/users/create/', {
            'username': 'testinvestigator',
            'email': 'inv@sentinel.ai',
            'password': 'SecurePassword123!',
            'full_name': 'Test Investigator',
            'role': 'investigator',
            'is_active': False
        }, format='json')
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        user_id = create_resp.json()['user']['id']

        # 2. Inactive user tries to login -> 403 Forbidden
        bad_login = self.client.post('/api/auth/user-login/', {
            'username': 'testinvestigator',
            'password': 'SecurePassword123!'
        }, format='json')
        self.assertEqual(bad_login.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Account Not Authorized', bad_login.json()['error'])

        # 3. Admin grants clearance / activates user
        toggle_resp = self.client.post(f'/api/admin/users/{user_id}/toggle-status/')
        self.assertEqual(toggle_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(toggle_resp.json()['is_active'])

        # 4. Now active user successfully logs in -> 200 OK
        good_login = self.client.post('/api/auth/user-login/', {
            'username': 'testinvestigator',
            'password': 'SecurePassword123!'
        }, format='json')
        self.assertEqual(good_login.status_code, status.HTTP_200_OK)
        self.assertEqual(good_login.json()['status'], 'authenticated')
        self.assertEqual(good_login.json()['user']['username'], 'testinvestigator')

        # 5. Clean up user
        del_resp = self.client.delete(f'/api/admin/users/{user_id}/delete/')
        self.assertEqual(del_resp.status_code, status.HTTP_200_OK)
        self.assertFalse(User.objects.filter(id=user_id).exists())

    def test_13_analyze_fraud_and_impersonation_endpoint(self):
        # Create synthetic test media for fraud forensics
        img = Image.new('RGB', (256, 256), color=(200, 180, 150))
        img_io = io.BytesIO()
        img.save(img_io, format='JPEG', quality=95)
        img_io.seek(0)
        img_io.name = "executive_id_sample.jpg"

        response = self.client.post('/api/analyze/fraud/', {
            'media': img_io,
            'fraud_category': 'identity_impersonation'
        }, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertIn("case_id", data)
        self.assertIn("fraud_risk_score", data)
        self.assertIn("threat_level", data)
        self.assertIn("ela_visualization", data)
        self.assertIn("forensic_checks", data)
        self.assertTrue(len(data["forensic_checks"]) >= 4)
        self.assertIn("recommended_action", data)

        # Verify DB persistence
        analysis = Analysis.objects.get(id=data["id"])
        self.assertIn("FRAUD", analysis.original_filename)




