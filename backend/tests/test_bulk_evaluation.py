"""
Backend API tests for Bulk Evaluation (CSV) feature
Tests: CSV template download, CSV upload evaluation, validation
"""
import pytest
import requests
import os
import tempfile

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestCSVTemplate:
    """Tests for GET /api/underwriting/csv-template"""

    def test_csv_template_download(self):
        """Test that CSV template downloads successfully"""
        response = requests.get(f"{BASE_URL}/api/underwriting/csv-template")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Verify content type
        assert 'text/csv' in response.headers.get('Content-Type', ''), "Response should be CSV"
        
        # Verify Content-Disposition header for download
        content_disposition = response.headers.get('Content-Disposition', '')
        assert 'attachment' in content_disposition, "Should have attachment disposition"
        assert 'proposal_template.csv' in content_disposition, "Filename should be proposal_template.csv"
        
        # Verify CSV content has headers and sample data
        content = response.text
        lines = content.strip().split('\n')
        assert len(lines) >= 2, "Template should have header + at least 1 sample row"
        
        # Verify required headers are present
        headers = lines[0].lower()
        assert 'proposal_id' in headers, "Template should have proposal_id column"
        assert 'product_type' in headers, "Template should have product_type column"
        assert 'applicant_age' in headers, "Template should have applicant_age column"
        assert 'sum_assured' in headers, "Template should have sum_assured column"
        assert 'premium' in headers, "Template should have premium column"
        
        print(f"CSV template downloaded successfully with {len(lines)} lines")


class TestCSVEvaluation:
    """Tests for POST /api/underwriting/evaluate-csv"""

    def test_evaluate_csv_valid_file(self):
        """Test evaluating a valid CSV file"""
        csv_content = """proposal_id,product_type,applicant_age,applicant_gender,applicant_income,sum_assured,premium,bmi,occupation_risk,is_smoker,cigarettes_per_day,smoking_years,has_medical_history,ailment_type,ailment_duration_years,is_ailment_ongoing
TEST_BULK_001,term_pure,35,M,1200000,5000000,25000,24.5,low,false,,,false,,,
TEST_BULK_002,term_pure,45,M,800000,3000000,15000,28,low,true,15,10,false,,,
TEST_BULK_003,term_returns,50,F,1500000,7000000,35000,26,medium,false,,,true,diabetes,5,true"""
        
        # Create temp CSV file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write(csv_content)
            temp_path = f.name
        
        try:
            with open(temp_path, 'rb') as f:
                response = requests.post(
                    f"{BASE_URL}/api/underwriting/evaluate-csv",
                    files={'file': ('test_proposals.csv', f, 'text/csv')}
                )
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            
            # Verify response structure
            assert 'total_proposals' in data, "Response should have total_proposals"
            assert 'pass_count' in data, "Response should have pass_count"
            assert 'fail_count' in data, "Response should have fail_count"
            assert 'pass_rate' in data, "Response should have pass_rate"
            assert 'total_time_ms' in data, "Response should have total_time_ms"
            assert 'parse_errors' in data, "Response should have parse_errors"
            assert 'results' in data, "Response should have results"
            
            # Verify counts
            assert data['total_proposals'] == 3, f"Expected 3 proposals, got {data['total_proposals']}"
            assert data['pass_count'] + data['fail_count'] == data['total_proposals'], "Pass + Fail should equal total"
            
            # Verify results array
            assert len(data['results']) == 3, f"Expected 3 results, got {len(data['results'])}"
            
            # Verify individual result structure
            for result in data['results']:
                assert 'proposal_id' in result, "Result should have proposal_id"
                assert 'stp_decision' in result, "Result should have stp_decision"
                assert result['stp_decision'] in ['PASS', 'FAIL'], "STP decision should be PASS or FAIL"
                assert 'case_type_label' in result, "Result should have case_type_label"
                assert 'base_premium' in result, "Result should have base_premium"
                assert 'loaded_premium' in result, "Result should have loaded_premium"
            
            # Verify no parse errors
            assert len(data['parse_errors']) == 0, f"Expected no parse errors, got {data['parse_errors']}"
            
            print(f"CSV evaluation successful: {data['total_proposals']} proposals, {data['pass_count']} passed, {data['fail_count']} failed")
            print(f"Pass rate: {data['pass_rate']}%, Time: {data['total_time_ms']}ms")
            
        finally:
            os.unlink(temp_path)

    def test_evaluate_csv_invalid_file_type(self):
        """Test that non-CSV files are rejected"""
        txt_content = "This is not a CSV file"
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(txt_content)
            temp_path = f.name
        
        try:
            with open(temp_path, 'rb') as f:
                response = requests.post(
                    f"{BASE_URL}/api/underwriting/evaluate-csv",
                    files={'file': ('test.txt', f, 'text/plain')}
                )
            
            assert response.status_code == 400, f"Expected 400 for invalid file type, got {response.status_code}"
            data = response.json()
            assert 'detail' in data, "Error response should have detail"
            print(f"Correctly rejected non-CSV file: {data['detail']}")
            
        finally:
            os.unlink(temp_path)

    def test_evaluate_csv_empty_file(self):
        """Test that empty CSV files are rejected"""
        csv_content = """proposal_id,product_type,applicant_age,applicant_gender,applicant_income,sum_assured,premium"""
        # Headers only, no data
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write(csv_content)
            temp_path = f.name
        
        try:
            with open(temp_path, 'rb') as f:
                response = requests.post(
                    f"{BASE_URL}/api/underwriting/evaluate-csv",
                    files={'file': ('empty.csv', f, 'text/csv')}
                )
            
            # Should return 400 as no valid proposals found
            assert response.status_code == 400, f"Expected 400 for empty CSV, got {response.status_code}"
            print("Correctly rejected CSV with only headers (no data)")
            
        finally:
            os.unlink(temp_path)

    def test_evaluate_csv_with_smoker_proposal(self):
        """Test evaluating proposals with smoker risk factors"""
        csv_content = """proposal_id,product_type,applicant_age,applicant_gender,applicant_income,sum_assured,premium,bmi,occupation_risk,is_smoker,cigarettes_per_day,smoking_years,has_medical_history,ailment_type,ailment_duration_years,is_ailment_ongoing
TEST_SMOKER_001,term_pure,40,M,1000000,5000000,30000,25,low,true,20,15,false,,,"""
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write(csv_content)
            temp_path = f.name
        
        try:
            with open(temp_path, 'rb') as f:
                response = requests.post(
                    f"{BASE_URL}/api/underwriting/evaluate-csv",
                    files={'file': ('smoker.csv', f, 'text/csv')}
                )
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            assert data['total_proposals'] == 1, "Should have 1 proposal"
            
            result = data['results'][0]
            assert result['proposal_id'] == 'TEST_SMOKER_001', "Proposal ID should match"
            
            # Smoker should have risk loading
            assert result['loading_percentage'] > 0, "Smoker should have premium loading"
            assert result['loaded_premium'] > result['base_premium'], "Loaded premium should be higher than base"
            
            print(f"Smoker evaluation: base={result['base_premium']}, loaded={result['loaded_premium']}, loading={result['loading_percentage']}%")
            
        finally:
            os.unlink(temp_path)


class TestExistingEndpoints:
    """Test existing endpoints for pages (Dashboard, Rules, Stages, Risk Bands)"""

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert 'total_rules' in data, "Should have total_rules"
        assert 'total_evaluations' in data, "Should have total_evaluations"
        assert 'stp_rate' in data, "Should have stp_rate"
        print(f"Dashboard stats: {data['total_rules']} rules, {data['total_evaluations']} evaluations")

    def test_rules_list(self):
        """Test rules list endpoint"""
        response = requests.get(f"{BASE_URL}/api/rules")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Rules list: {len(data)} rules found")

    def test_stages_list(self):
        """Test stages list endpoint"""
        response = requests.get(f"{BASE_URL}/api/stages")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Stages list: {len(data)} stages found")

    def test_risk_bands_list(self):
        """Test risk bands list endpoint"""
        response = requests.get(f"{BASE_URL}/api/risk-bands")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Risk bands list: {len(data)} risk bands found")

    def test_products_list(self):
        """Test products list endpoint"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Products list: {len(data)} products found")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
