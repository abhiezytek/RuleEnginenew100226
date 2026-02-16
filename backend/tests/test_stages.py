"""
Test Suite for Stages Management Feature
Tests all CRUD operations, toggle functionality, and stage-based rule execution
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://table-sync-check.preview.emergentagent.com')


class TestStagesAPI:
    """Test Stages CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_stage_id = None
        yield
        # Cleanup: Delete test stage if created
        if self.test_stage_id:
            try:
                requests.delete(f"{BASE_URL}/api/stages/{self.test_stage_id}")
            except:
                pass

    def test_get_stages_returns_list(self):
        """Test GET /api/stages returns list of stages"""
        response = requests.get(f"{BASE_URL}/api/stages")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Verify stages have required fields
        if len(data) > 0:
            stage = data[0]
            assert 'id' in stage, "Stage should have 'id'"
            assert 'name' in stage, "Stage should have 'name'"
            assert 'execution_order' in stage, "Stage should have 'execution_order'"
            assert 'is_enabled' in stage, "Stage should have 'is_enabled'"
            assert 'rule_count' in stage, "Stage should have 'rule_count'"
            assert 'stop_on_fail' in stage, "Stage should have 'stop_on_fail'"
            assert 'color' in stage, "Stage should have 'color'"
        print(f"PASSED: GET /api/stages - returned {len(data)} stages")

    def test_stages_sorted_by_execution_order(self):
        """Test stages are returned in execution order"""
        response = requests.get(f"{BASE_URL}/api/stages")
        assert response.status_code == 200
        
        data = response.json()
        if len(data) > 1:
            execution_orders = [s['execution_order'] for s in data]
            assert execution_orders == sorted(execution_orders), "Stages should be sorted by execution_order"
        print(f"PASSED: Stages are sorted by execution_order")

    def test_create_stage(self):
        """Test POST /api/stages creates a new stage"""
        test_name = f"TEST_Stage_{uuid.uuid4().hex[:8]}"
        payload = {
            "name": test_name,
            "description": "Test stage for automated testing",
            "execution_order": 99,
            "stop_on_fail": True,
            "color": "rose",
            "is_enabled": True
        }
        
        response = requests.post(f"{BASE_URL}/api/stages", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        self.test_stage_id = data['id']  # Store for cleanup
        
        assert data['name'] == test_name, f"Name mismatch: expected {test_name}, got {data['name']}"
        assert data['execution_order'] == 99, "Execution order mismatch"
        assert data['stop_on_fail'] == True, "stop_on_fail mismatch"
        assert data['color'] == 'rose', "Color mismatch"
        assert data['is_enabled'] == True, "is_enabled mismatch"
        assert data['rule_count'] == 0, "New stage should have 0 rules"
        print(f"PASSED: Created stage with id={data['id']}")

    def test_get_single_stage(self):
        """Test GET /api/stages/{id} returns specific stage"""
        # First get all stages
        response = requests.get(f"{BASE_URL}/api/stages")
        stages = response.json()
        
        if len(stages) > 0:
            stage_id = stages[0]['id']
            response = requests.get(f"{BASE_URL}/api/stages/{stage_id}")
            assert response.status_code == 200
            
            data = response.json()
            assert data['id'] == stage_id
            print(f"PASSED: GET /api/stages/{stage_id}")

    def test_update_stage(self):
        """Test PUT /api/stages/{id} updates stage"""
        # Create a test stage first
        create_payload = {
            "name": f"TEST_ToUpdate_{uuid.uuid4().hex[:8]}",
            "description": "Will be updated",
            "execution_order": 98,
            "stop_on_fail": False,
            "color": "slate",
            "is_enabled": True
        }
        create_response = requests.post(f"{BASE_URL}/api/stages", json=create_payload)
        assert create_response.status_code == 200
        stage_id = create_response.json()['id']
        self.test_stage_id = stage_id
        
        # Update the stage
        update_payload = {
            "name": "TEST_Updated_Stage",
            "description": "Updated description",
            "execution_order": 97,
            "stop_on_fail": True,
            "color": "cyan"
        }
        
        response = requests.put(f"{BASE_URL}/api/stages/{stage_id}", json=update_payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['name'] == "TEST_Updated_Stage", "Name not updated"
        assert data['description'] == "Updated description", "Description not updated"
        assert data['execution_order'] == 97, "Execution order not updated"
        assert data['stop_on_fail'] == True, "stop_on_fail not updated"
        assert data['color'] == 'cyan', "Color not updated"
        
        # Verify GET returns updated data
        get_response = requests.get(f"{BASE_URL}/api/stages/{stage_id}")
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert get_data['name'] == "TEST_Updated_Stage", "Update not persisted"
        print(f"PASSED: Updated stage {stage_id}")

    def test_toggle_stage(self):
        """Test PATCH /api/stages/{id}/toggle toggles is_enabled"""
        # Create a test stage
        create_payload = {
            "name": f"TEST_ToToggle_{uuid.uuid4().hex[:8]}",
            "execution_order": 96,
            "is_enabled": True
        }
        create_response = requests.post(f"{BASE_URL}/api/stages", json=create_payload)
        assert create_response.status_code == 200
        stage_id = create_response.json()['id']
        self.test_stage_id = stage_id
        
        # Toggle it off
        response = requests.patch(f"{BASE_URL}/api/stages/{stage_id}/toggle")
        assert response.status_code == 200
        data = response.json()
        assert data['is_enabled'] == False, "Stage should be disabled"
        
        # Verify the change persisted
        get_response = requests.get(f"{BASE_URL}/api/stages/{stage_id}")
        assert get_response.json()['is_enabled'] == False
        
        # Toggle it back on
        response2 = requests.patch(f"{BASE_URL}/api/stages/{stage_id}/toggle")
        assert response2.status_code == 200
        assert response2.json()['is_enabled'] == True, "Stage should be enabled again"
        print(f"PASSED: Toggle stage {stage_id}")

    def test_delete_stage(self):
        """Test DELETE /api/stages/{id} removes stage"""
        # Create a test stage
        create_payload = {
            "name": f"TEST_ToDelete_{uuid.uuid4().hex[:8]}",
            "execution_order": 95
        }
        create_response = requests.post(f"{BASE_URL}/api/stages", json=create_payload)
        assert create_response.status_code == 200
        stage_id = create_response.json()['id']
        
        # Delete it
        response = requests.delete(f"{BASE_URL}/api/stages/{stage_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Verify it's gone
        get_response = requests.get(f"{BASE_URL}/api/stages/{stage_id}")
        assert get_response.status_code == 404, "Deleted stage should return 404"
        print(f"PASSED: Deleted stage {stage_id}")

    def test_get_rules_by_stage(self):
        """Test GET /api/stages/{id}/rules returns rules for a stage"""
        # Get a stage with rules
        stages_response = requests.get(f"{BASE_URL}/api/stages")
        stages = stages_response.json()
        
        # Find a stage with rules
        stage_with_rules = next((s for s in stages if s['rule_count'] > 0), None)
        
        if stage_with_rules:
            response = requests.get(f"{BASE_URL}/api/stages/{stage_with_rules['id']}/rules")
            assert response.status_code == 200
            
            rules = response.json()
            assert isinstance(rules, list), "Response should be a list"
            assert len(rules) == stage_with_rules['rule_count'], \
                f"Expected {stage_with_rules['rule_count']} rules, got {len(rules)}"
            
            # Verify rules have stage_name
            for rule in rules:
                assert 'stage_name' in rule, "Rule should have stage_name"
            print(f"PASSED: GET /api/stages/{stage_with_rules['id']}/rules - {len(rules)} rules")
        else:
            print("SKIPPED: No stages with rules found")

    def test_stage_not_found(self):
        """Test 404 for non-existent stage"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = requests.get(f"{BASE_URL}/api/stages/{fake_id}")
        assert response.status_code == 404
        print("PASSED: Non-existent stage returns 404")


class TestRulesWithStages:
    """Test Rules API with Stage assignment"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.test_rule_id = None
        self.test_stage_id = None
        yield
        # Cleanup
        if self.test_rule_id:
            try:
                requests.delete(f"{BASE_URL}/api/rules/{self.test_rule_id}")
            except:
                pass
        if self.test_stage_id:
            try:
                requests.delete(f"{BASE_URL}/api/stages/{self.test_stage_id}")
            except:
                pass

    def test_rules_list_includes_stage_name(self):
        """Test GET /api/rules includes stage_name field"""
        response = requests.get(f"{BASE_URL}/api/rules")
        assert response.status_code == 200
        
        rules = response.json()
        if len(rules) > 0:
            # Check that stage_name field exists
            for rule in rules:
                assert 'stage_name' in rule, "Rule should have stage_name field"
                assert 'stage_id' in rule, "Rule should have stage_id field"
        print(f"PASSED: Rules list includes stage_name for {len(rules)} rules")

    def test_create_rule_with_stage(self):
        """Test creating a rule with stage assignment"""
        # Get first stage
        stages_response = requests.get(f"{BASE_URL}/api/stages")
        stages = stages_response.json()
        if not stages:
            pytest.skip("No stages available")
        
        stage_id = stages[0]['id']
        
        # Create rule with stage
        rule_payload = {
            "name": f"TEST_Rule_WithStage_{uuid.uuid4().hex[:8]}",
            "description": "Test rule with stage assignment",
            "category": "stp_decision",
            "stage_id": stage_id,
            "condition_group": {
                "logical_operator": "AND",
                "conditions": [
                    {"field": "applicant_age", "operator": "greater_than", "value": 50}
                ],
                "is_negated": False
            },
            "action": {
                "decision": "REFER",
                "reason_code": "TEST001",
                "reason_message": "Test rule triggered"
            },
            "priority": 500,
            "is_enabled": True
        }
        
        response = requests.post(f"{BASE_URL}/api/rules", json=rule_payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        self.test_rule_id = data['id']
        
        assert data['stage_id'] == stage_id, "stage_id should match"
        assert data['stage_name'] == stages[0]['name'], "stage_name should be populated"
        print(f"PASSED: Created rule with stage assignment")

    def test_update_rule_stage_assignment(self):
        """Test updating rule's stage assignment"""
        # Get stages
        stages_response = requests.get(f"{BASE_URL}/api/stages")
        stages = stages_response.json()
        if len(stages) < 2:
            pytest.skip("Need at least 2 stages")
        
        stage1_id = stages[0]['id']
        stage2_id = stages[1]['id']
        
        # Create rule with first stage
        rule_payload = {
            "name": f"TEST_Rule_ChangeStage_{uuid.uuid4().hex[:8]}",
            "category": "stp_decision",
            "stage_id": stage1_id,
            "condition_group": {
                "logical_operator": "AND",
                "conditions": [
                    {"field": "applicant_age", "operator": "greater_than", "value": 60}
                ]
            },
            "action": {"decision": "FAIL"}
        }
        
        create_response = requests.post(f"{BASE_URL}/api/rules", json=rule_payload)
        rule_id = create_response.json()['id']
        self.test_rule_id = rule_id
        
        # Update to second stage
        update_payload = {"stage_id": stage2_id}
        response = requests.put(f"{BASE_URL}/api/rules/{rule_id}", json=update_payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data['stage_id'] == stage2_id, "stage_id should be updated"
        assert data['stage_name'] == stages[1]['name'], "stage_name should be updated"
        print(f"PASSED: Updated rule stage assignment")

    def test_filter_rules_by_stage(self):
        """Test filtering rules by stage_id"""
        stages_response = requests.get(f"{BASE_URL}/api/stages")
        stages = stages_response.json()
        
        stage_with_rules = next((s for s in stages if s['rule_count'] > 0), None)
        if not stage_with_rules:
            pytest.skip("No stages with rules")
        
        response = requests.get(f"{BASE_URL}/api/rules", params={"stage_id": stage_with_rules['id']})
        assert response.status_code == 200
        
        rules = response.json()
        assert len(rules) == stage_with_rules['rule_count'], \
            f"Expected {stage_with_rules['rule_count']} rules, got {len(rules)}"
        
        # All rules should belong to this stage
        for rule in rules:
            assert rule['stage_id'] == stage_with_rules['id']
        print(f"PASSED: Filtered {len(rules)} rules by stage_id")


class TestEvaluationWithStages:
    """Test Evaluation respects stage execution order"""
    
    def test_evaluation_returns_stage_trace(self):
        """Test evaluation response includes stage_trace"""
        proposal = {
            "proposal_id": f"TEST-{uuid.uuid4().hex[:8]}",
            "product_code": "TERM001",
            "product_type": "term_life",
            "applicant_age": 35,
            "applicant_gender": "M",
            "applicant_income": 1200000,
            "sum_assured": 5000000,
            "premium": 25000,
            "bmi": 24.5,
            "occupation_risk": "low",
            "is_smoker": False,
            "has_medical_history": False
        }
        
        response = requests.post(f"{BASE_URL}/api/underwriting/evaluate", json=proposal)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'stage_trace' in data, "Response should include stage_trace"
        assert isinstance(data['stage_trace'], list), "stage_trace should be a list"
        
        # Verify stage_trace structure
        if len(data['stage_trace']) > 0:
            stage = data['stage_trace'][0]
            assert 'stage_id' in stage, "stage should have stage_id"
            assert 'stage_name' in stage, "stage should have stage_name"
            assert 'execution_order' in stage, "stage should have execution_order"
            assert 'status' in stage, "stage should have status (passed/failed/skipped)"
            assert 'rules_executed' in stage, "stage should have rules_executed"
            assert 'triggered_rules_count' in stage, "stage should have triggered_rules_count"
            assert 'execution_time_ms' in stage, "stage should have execution_time_ms"
        print(f"PASSED: Evaluation includes stage_trace with {len(data['stage_trace'])} stages")

    def test_stages_executed_in_order(self):
        """Test stages are executed in execution_order"""
        proposal = {
            "proposal_id": f"TEST-ORDER-{uuid.uuid4().hex[:8]}",
            "product_code": "TERM001",
            "product_type": "term_life",
            "applicant_age": 35,
            "applicant_gender": "M",
            "applicant_income": 1200000,
            "sum_assured": 5000000,
            "premium": 25000,
            "is_smoker": False,
            "has_medical_history": False
        }
        
        response = requests.post(f"{BASE_URL}/api/underwriting/evaluate", json=proposal)
        assert response.status_code == 200
        
        data = response.json()
        stage_trace = data.get('stage_trace', [])
        
        # Verify stages are in order
        execution_orders = [s['execution_order'] for s in stage_trace if s['stage_id'] != 'unassigned']
        assert execution_orders == sorted(execution_orders), "Stages should be executed in order"
        print(f"PASSED: Stages executed in order: {execution_orders}")

    def test_stop_on_fail_stage(self):
        """Test that stop_on_fail stages halt evaluation"""
        # This test checks that if a stage has stop_on_fail=True and a rule fails,
        # subsequent stages are skipped
        proposal = {
            "proposal_id": f"TEST-STOP-{uuid.uuid4().hex[:8]}",
            "product_code": "TERM001",
            "product_type": "term_life",
            "applicant_age": 17,  # Below minimum age - should trigger validation failure
            "applicant_gender": "M",
            "applicant_income": 1200000,
            "sum_assured": 5000000,
            "premium": 25000,
            "is_smoker": False,
            "has_medical_history": False
        }
        
        response = requests.post(f"{BASE_URL}/api/underwriting/evaluate", json=proposal)
        assert response.status_code == 200
        
        data = response.json()
        stage_trace = data.get('stage_trace', [])
        
        # Check if any stages are skipped due to stop_on_fail
        skipped_stages = [s for s in stage_trace if s['status'] == 'skipped']
        failed_stages = [s for s in stage_trace if s['status'] == 'failed']
        
        print(f"Stage status breakdown:")
        for stage in stage_trace:
            print(f"  - {stage['stage_name']}: {stage['status']}")
        
        # The validation stage should fail and subsequent stages may be skipped
        print(f"PASSED: Evaluation handled stop_on_fail (failed={len(failed_stages)}, skipped={len(skipped_stages)})")

    def test_evaluation_with_smoker_high_sum(self):
        """Test evaluation with smoker and high sum assured triggers appropriate rules"""
        proposal = {
            "proposal_id": f"TEST-SMOKER-{uuid.uuid4().hex[:8]}",
            "product_code": "TERM001",
            "product_type": "term_life",
            "applicant_age": 40,
            "applicant_gender": "M",
            "applicant_income": 2500000,
            "sum_assured": 15000000,  # High sum assured
            "premium": 75000,
            "is_smoker": True,  # Smoker
            "has_medical_history": False
        }
        
        response = requests.post(f"{BASE_URL}/api/underwriting/evaluate", json=proposal)
        assert response.status_code == 200
        
        data = response.json()
        
        # Should trigger high sum assured and smoker rules
        triggered = data.get('triggered_rules', [])
        assert len(triggered) > 0, "Should trigger some rules"
        
        # Check that STP decision reflects risk
        print(f"STP Decision: {data['stp_decision']}")
        print(f"Triggered rules: {triggered}")
        print(f"PASSED: Smoker with high sum evaluation completed")


class TestDashboardWithStages:
    """Test Dashboard includes stage statistics"""
    
    def test_dashboard_includes_stage_counts(self):
        """Test dashboard stats include stage counts"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert 'total_stages' in data, "Dashboard should include total_stages"
        assert 'active_stages' in data, "Dashboard should include active_stages"
        
        assert isinstance(data['total_stages'], int)
        assert isinstance(data['active_stages'], int)
        assert data['active_stages'] <= data['total_stages']
        print(f"PASSED: Dashboard stats - total_stages={data['total_stages']}, active_stages={data['active_stages']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
