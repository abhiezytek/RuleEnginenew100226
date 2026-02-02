#!/usr/bin/env python3

import requests
import json
import sys
import time
from datetime import datetime

class LifeInsuranceAPITester:
    def __init__(self, base_url="https://policy-logic.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_resources = {
            'rules': [],
            'scorecards': [],
            'grids': [],
            'products': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_endpoints(self):
        """Test health check endpoints"""
        print("\n" + "="*50)
        print("TESTING HEALTH ENDPOINTS")
        print("="*50)
        
        self.run_test("Root endpoint", "GET", "", 200)
        self.run_test("Health check", "GET", "health", 200)

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        print("\n" + "="*50)
        print("TESTING DASHBOARD STATS")
        print("="*50)
        
        success, data = self.run_test("Dashboard stats", "GET", "dashboard/stats", 200)
        if success:
            required_fields = ['total_rules', 'active_rules', 'total_evaluations', 'stp_rate']
            for field in required_fields:
                if field in data:
                    print(f"   ✓ {field}: {data[field]}")
                else:
                    print(f"   ⚠️  Missing field: {field}")

    def test_seed_data(self):
        """Test seed data functionality"""
        print("\n" + "="*50)
        print("TESTING SEED DATA")
        print("="*50)
        
        success, data = self.run_test("Seed sample data", "POST", "seed", 200)
        if success:
            print(f"   ✓ Products seeded: {data.get('products', 0)}")
            print(f"   ✓ Rules seeded: {data.get('rules', 0)}")
            print(f"   ✓ Scorecards seeded: {data.get('scorecards', 0)}")
            print(f"   ✓ Grids seeded: {data.get('grids', 0)}")

    def test_products_crud(self):
        """Test products CRUD operations"""
        print("\n" + "="*50)
        print("TESTING PRODUCTS CRUD")
        print("="*50)
        
        # Get products
        success, products = self.run_test("Get products", "GET", "products", 200)
        if success:
            print(f"   ✓ Found {len(products)} products")
        
        # Create product
        product_data = {
            "code": "TEST001",
            "name": "Test Product",
            "product_type": "term_life",
            "description": "Test product for API testing",
            "min_age": 18,
            "max_age": 65,
            "min_sum_assured": 100000,
            "max_sum_assured": 10000000,
            "min_premium": 1000,
            "is_enabled": True
        }
        
        success, created_product = self.run_test("Create product", "POST", "products", 200, product_data)
        if success and 'id' in created_product:
            product_id = created_product['id']
            self.created_resources['products'].append(product_id)
            print(f"   ✓ Created product with ID: {product_id}")
            
            # Get single product
            self.run_test("Get single product", "GET", f"products/{product_id}", 200)
            
            # Update product
            update_data = {**product_data, "name": "Updated Test Product"}
            self.run_test("Update product", "PUT", f"products/{product_id}", 200, update_data)

    def test_rules_crud(self):
        """Test rules CRUD operations"""
        print("\n" + "="*50)
        print("TESTING RULES CRUD")
        print("="*50)
        
        # Get rules
        success, rules = self.run_test("Get rules", "GET", "rules", 200)
        if success:
            print(f"   ✓ Found {len(rules)} rules")
        
        # Test filtering
        self.run_test("Get rules by category", "GET", "rules?category=stp_decision", 200)
        self.run_test("Get enabled rules", "GET", "rules?is_enabled=true", 200)
        
        # Create rule
        rule_data = {
            "name": "Test API Rule",
            "description": "Test rule created via API",
            "category": "stp_decision",
            "condition_group": {
                "logical_operator": "AND",
                "conditions": [
                    {
                        "field": "applicant_age",
                        "operator": "greater_than",
                        "value": 65
                    }
                ],
                "is_negated": False
            },
            "action": {
                "decision": "FAIL",
                "reason_code": "TEST001",
                "reason_message": "Age exceeds limit",
                "is_hard_stop": True
            },
            "priority": 50,
            "is_enabled": True,
            "products": ["term_life"],
            "case_types": []
        }
        
        success, created_rule = self.run_test("Create rule", "POST", "rules", 200, rule_data)
        if success and 'id' in created_rule:
            rule_id = created_rule['id']
            self.created_resources['rules'].append(rule_id)
            print(f"   ✓ Created rule with ID: {rule_id}")
            
            # Get single rule
            self.run_test("Get single rule", "GET", f"rules/{rule_id}", 200)
            
            # Toggle rule
            self.run_test("Toggle rule", "PATCH", f"rules/{rule_id}/toggle", 200)
            
            # Update rule
            update_data = {**rule_data, "name": "Updated Test Rule"}
            self.run_test("Update rule", "PUT", f"rules/{rule_id}", 200, update_data)

    def test_scorecards_crud(self):
        """Test scorecards CRUD operations"""
        print("\n" + "="*50)
        print("TESTING SCORECARDS CRUD")
        print("="*50)
        
        # Get scorecards
        success, scorecards = self.run_test("Get scorecards", "GET", "scorecards", 200)
        if success:
            print(f"   ✓ Found {len(scorecards)} scorecards")
        
        # Create scorecard
        scorecard_data = {
            "name": "Test Scorecard",
            "description": "Test scorecard for API testing",
            "product": "term_life",
            "parameters": [
                {
                    "name": "Age Band",
                    "field": "applicant_age",
                    "weight": 1.0,
                    "bands": [
                        {"min": 18, "max": 30, "score": 20, "label": "18-30"},
                        {"min": 31, "max": 50, "score": 15, "label": "31-50"}
                    ]
                }
            ],
            "threshold_direct_accept": 80,
            "threshold_normal": 50,
            "threshold_refer": 30,
            "is_enabled": True
        }
        
        success, created_scorecard = self.run_test("Create scorecard", "POST", "scorecards", 200, scorecard_data)
        if success and 'id' in created_scorecard:
            scorecard_id = created_scorecard['id']
            self.created_resources['scorecards'].append(scorecard_id)
            print(f"   ✓ Created scorecard with ID: {scorecard_id}")
            
            # Get single scorecard
            self.run_test("Get single scorecard", "GET", f"scorecards/{scorecard_id}", 200)

    def test_grids_crud(self):
        """Test grids CRUD operations"""
        print("\n" + "="*50)
        print("TESTING GRIDS CRUD")
        print("="*50)
        
        # Get grids
        success, grids = self.run_test("Get grids", "GET", "grids", 200)
        if success:
            print(f"   ✓ Found {len(grids)} grids")
        
        # Create grid
        grid_data = {
            "name": "Test Grid",
            "description": "Test grid for API testing",
            "grid_type": "test",
            "row_field": "applicant_age",
            "col_field": "sum_assured",
            "row_labels": ["18-30", "31-50"],
            "col_labels": ["<10L", "10L+"],
            "cells": [
                {"row_value": "18-30", "col_value": "<10L", "result": "ACCEPT", "score_impact": 10},
                {"row_value": "31-50", "col_value": "10L+", "result": "REFER", "score_impact": -5}
            ],
            "products": ["term_life"],
            "is_enabled": True
        }
        
        success, created_grid = self.run_test("Create grid", "POST", "grids", 200, grid_data)
        if success and 'id' in created_grid:
            grid_id = created_grid['id']
            self.created_resources['grids'].append(grid_id)
            print(f"   ✓ Created grid with ID: {grid_id}")
            
            # Get single grid
            self.run_test("Get single grid", "GET", f"grids/{grid_id}", 200)

    def test_underwriting_evaluation(self):
        """Test the main underwriting evaluation endpoint"""
        print("\n" + "="*50)
        print("TESTING UNDERWRITING EVALUATION")
        print("="*50)
        
        # Test proposal data
        proposal_data = {
            "proposal_id": f"TEST-{int(time.time())}",
            "product_code": "TERM001",
            "product_type": "term_life",
            "applicant_age": 35,
            "applicant_gender": "M",
            "applicant_income": 1200000,
            "sum_assured": 5000000,
            "premium": 25000,
            "bmi": 24.5,
            "occupation_code": "IT001",
            "occupation_risk": "low",
            "agent_code": "AGT001",
            "agent_tier": "gold",
            "pincode": "560001",
            "is_smoker": False,
            "has_medical_history": False,
            "existing_coverage": 0,
            "additional_data": {}
        }
        
        success, result = self.run_test("Evaluate proposal", "POST", "underwriting/evaluate", 200, proposal_data)
        if success:
            required_fields = ['proposal_id', 'stp_decision', 'case_type', 'scorecard_value', 'evaluation_time_ms']
            for field in required_fields:
                if field in result:
                    print(f"   ✓ {field}: {result[field]}")
                else:
                    print(f"   ⚠️  Missing field: {field}")
            
            # Test high-risk proposal (should fail STP)
            high_risk_proposal = {**proposal_data, 
                                "proposal_id": f"HIGH-RISK-{int(time.time())}", 
                                "applicant_age": 70, 
                                "sum_assured": 50000000}
            
            success2, result2 = self.run_test("Evaluate high-risk proposal", "POST", "underwriting/evaluate", 200, high_risk_proposal)
            if success2:
                print(f"   ✓ High-risk STP decision: {result2.get('stp_decision', 'N/A')}")

    def test_audit_logs(self):
        """Test audit logs endpoint"""
        print("\n" + "="*50)
        print("TESTING AUDIT LOGS")
        print("="*50)
        
        success, logs = self.run_test("Get audit logs", "GET", "audit-logs", 200)
        if success:
            print(f"   ✓ Found {len(logs)} audit log entries")

    def test_evaluations_history(self):
        """Test evaluations history endpoint"""
        print("\n" + "="*50)
        print("TESTING EVALUATIONS HISTORY")
        print("="*50)
        
        success, evaluations = self.run_test("Get evaluations", "GET", "evaluations", 200)
        if success:
            print(f"   ✓ Found {len(evaluations)} evaluation records")

    def cleanup_resources(self):
        """Clean up created test resources"""
        print("\n" + "="*50)
        print("CLEANING UP TEST RESOURCES")
        print("="*50)
        
        # Delete created rules
        for rule_id in self.created_resources['rules']:
            self.run_test(f"Delete rule {rule_id}", "DELETE", f"rules/{rule_id}", 200)
        
        # Delete created products
        for product_id in self.created_resources['products']:
            self.run_test(f"Delete product {product_id}", "DELETE", f"products/{product_id}", 200)
        
        # Delete created scorecards
        for scorecard_id in self.created_resources['scorecards']:
            self.run_test(f"Delete scorecard {scorecard_id}", "DELETE", f"scorecards/{scorecard_id}", 200)
        
        # Delete created grids
        for grid_id in self.created_resources['grids']:
            self.run_test(f"Delete grid {grid_id}", "DELETE", f"grids/{grid_id}", 200)

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Life Insurance STP Rule Engine API Tests")
        print(f"📍 Base URL: {self.base_url}")
        print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        try:
            # Core functionality tests
            self.test_health_endpoints()
            self.test_seed_data()
            self.test_dashboard_stats()
            
            # CRUD operations tests
            self.test_products_crud()
            self.test_rules_crud()
            self.test_scorecards_crud()
            self.test_grids_crud()
            
            # Business logic tests
            self.test_underwriting_evaluation()
            
            # Audit and history tests
            self.test_audit_logs()
            self.test_evaluations_history()
            
        except KeyboardInterrupt:
            print("\n⚠️  Tests interrupted by user")
        except Exception as e:
            print(f"\n💥 Unexpected error: {str(e)}")
        finally:
            # Always try to clean up
            self.cleanup_resources()
        
        # Print final results
        print("\n" + "="*60)
        print("📊 FINAL TEST RESULTS")
        print("="*60)
        print(f"✅ Tests passed: {self.tests_passed}")
        print(f"❌ Tests failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "No tests run")
        print(f"⏱️  Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = LifeInsuranceAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())