from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any, Union
import uuid
from datetime import datetime, timezone
from enum import Enum
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Life Insurance STP & Underwriting Rule Engine")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== ENUMS ====================
class RuleCategory(str, Enum):
    STP_DECISION = "stp_decision"
    CASE_TYPE = "case_type"
    REASON_FLAG = "reason_flag"
    SCORECARD = "scorecard"
    INCOME_SA_GRID = "income_sa_grid"
    BMI_GRID = "bmi_grid"
    OCCUPATION = "occupation"
    AGENT_CHANNEL = "agent_channel"
    ADDRESS_PINCODE = "address_pincode"
    VALIDATION = "validation"

class Operator(str, Enum):
    EQUALS = "equals"
    NOT_EQUALS = "not_equals"
    GREATER_THAN = "greater_than"
    LESS_THAN = "less_than"
    GREATER_THAN_OR_EQUAL = "greater_than_or_equal"
    LESS_THAN_OR_EQUAL = "less_than_or_equal"
    IN = "in"
    NOT_IN = "not_in"
    BETWEEN = "between"
    CONTAINS = "contains"
    STARTS_WITH = "starts_with"
    IS_EMPTY = "is_empty"
    IS_NOT_EMPTY = "is_not_empty"

class LogicalOperator(str, Enum):
    AND = "AND"
    OR = "OR"

class CaseType(int, Enum):
    NORMAL = 0
    DIRECT_ACCEPT = 1
    DIRECT_FAIL = -1
    GCRP = 3

class ReasonFlag(int, Enum):
    STP_FAIL_PRINT = 1
    STP_PASS_SKIP = 0
    NOT_PROVIDED = -1

class ProductType(str, Enum):
    TERM_LIFE = "term_life"
    ENDOWMENT = "endowment"
    ULIP = "ulip"

# ==================== MODELS ====================
class Condition(BaseModel):
    field: str
    operator: Operator
    value: Any
    value2: Optional[Any] = None  # For BETWEEN operator

class ConditionGroup(BaseModel):
    logical_operator: LogicalOperator = LogicalOperator.AND
    conditions: List[Union['ConditionGroup', Condition]] = []
    is_negated: bool = False

ConditionGroup.model_rebuild()

class RuleAction(BaseModel):
    decision: Optional[str] = None
    score_impact: Optional[int] = None
    case_type: Optional[CaseType] = None
    reason_code: Optional[str] = None
    reason_message: Optional[str] = None
    is_hard_stop: bool = False

class Rule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    category: RuleCategory
    condition_group: ConditionGroup
    action: RuleAction
    priority: int = 100
    is_enabled: bool = True
    effective_from: Optional[str] = None
    effective_to: Optional[str] = None
    products: List[ProductType] = []
    case_types: List[CaseType] = []
    version: int = 1
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class RuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: RuleCategory
    condition_group: ConditionGroup
    action: RuleAction
    priority: int = 100
    is_enabled: bool = True
    effective_from: Optional[str] = None
    effective_to: Optional[str] = None
    products: List[ProductType] = []
    case_types: List[CaseType] = []

class RuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[RuleCategory] = None
    condition_group: Optional[ConditionGroup] = None
    action: Optional[RuleAction] = None
    priority: Optional[int] = None
    is_enabled: Optional[bool] = None
    effective_from: Optional[str] = None
    effective_to: Optional[str] = None
    products: Optional[List[ProductType]] = None
    case_types: Optional[List[CaseType]] = None

# Scorecard Models
class ScorecardParameter(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    field: str
    weight: float = 1.0
    bands: List[Dict[str, Any]] = []

class Scorecard(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    product: ProductType
    parameters: List[ScorecardParameter] = []
    threshold_direct_accept: int = 80
    threshold_normal: int = 50
    threshold_refer: int = 30
    is_enabled: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ScorecardCreate(BaseModel):
    name: str
    description: Optional[str] = None
    product: ProductType
    parameters: List[ScorecardParameter] = []
    threshold_direct_accept: int = 80
    threshold_normal: int = 50
    threshold_refer: int = 30
    is_enabled: bool = True

# Grid Models
class GridCell(BaseModel):
    row_value: str
    col_value: str
    result: str
    score_impact: Optional[int] = None

class Grid(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    grid_type: str  # bmi, income_sa, occupation
    row_field: str
    col_field: str
    row_labels: List[str] = []
    col_labels: List[str] = []
    cells: List[GridCell] = []
    products: List[ProductType] = []
    is_enabled: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class GridCreate(BaseModel):
    name: str
    description: Optional[str] = None
    grid_type: str
    row_field: str
    col_field: str
    row_labels: List[str] = []
    col_labels: List[str] = []
    cells: List[GridCell] = []
    products: List[ProductType] = []
    is_enabled: bool = True

# Product Models
class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    name: str
    product_type: ProductType
    description: Optional[str] = None
    min_age: int = 18
    max_age: int = 65
    min_sum_assured: int = 100000
    max_sum_assured: int = 10000000
    min_premium: int = 1000
    is_enabled: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ProductCreate(BaseModel):
    code: str
    name: str
    product_type: ProductType
    description: Optional[str] = None
    min_age: int = 18
    max_age: int = 65
    min_sum_assured: int = 100000
    max_sum_assured: int = 10000000
    min_premium: int = 1000
    is_enabled: bool = True

# Evaluation Models
class ProposalData(BaseModel):
    proposal_id: str
    product_code: str
    product_type: ProductType
    applicant_age: int
    applicant_gender: str
    applicant_income: float
    sum_assured: float
    premium: float
    bmi: Optional[float] = None
    occupation_code: Optional[str] = None
    occupation_risk: Optional[str] = None
    agent_code: Optional[str] = None
    agent_tier: Optional[str] = None
    pincode: Optional[str] = None
    is_smoker: bool = False
    has_medical_history: bool = False
    existing_coverage: float = 0
    additional_data: Dict[str, Any] = {}

class RuleExecutionTrace(BaseModel):
    rule_id: str
    rule_name: str
    category: str
    triggered: bool
    input_values: Dict[str, Any]
    condition_result: bool
    action_applied: Optional[Dict[str, Any]] = None
    execution_time_ms: float

class EvaluationResult(BaseModel):
    proposal_id: str
    stp_decision: str  # PASS, FAIL
    case_type: CaseType
    case_type_label: str
    reason_flag: ReasonFlag
    scorecard_value: int
    triggered_rules: List[str]
    validation_errors: List[str]
    reason_codes: List[str]
    reason_messages: List[str]
    rule_trace: List[RuleExecutionTrace]
    evaluation_time_ms: float
    evaluated_at: str

class AuditLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    action: str
    entity_type: str
    entity_id: str
    entity_name: str
    changes: Dict[str, Any] = {}
    performed_by: str = "system"
    performed_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ==================== RULE ENGINE ====================
class RuleEngine:
    def __init__(self):
        self.operators = {
            Operator.EQUALS: lambda a, b, _: a == b,
            Operator.NOT_EQUALS: lambda a, b, _: a != b,
            Operator.GREATER_THAN: lambda a, b, _: float(a) > float(b) if a is not None and b is not None else False,
            Operator.LESS_THAN: lambda a, b, _: float(a) < float(b) if a is not None and b is not None else False,
            Operator.GREATER_THAN_OR_EQUAL: lambda a, b, _: float(a) >= float(b) if a is not None and b is not None else False,
            Operator.LESS_THAN_OR_EQUAL: lambda a, b, _: float(a) <= float(b) if a is not None and b is not None else False,
            Operator.IN: lambda a, b, _: a in b if isinstance(b, list) else a == b,
            Operator.NOT_IN: lambda a, b, _: a not in b if isinstance(b, list) else a != b,
            Operator.BETWEEN: lambda a, b, c: float(b) <= float(a) <= float(c) if a is not None and b is not None and c is not None else False,
            Operator.CONTAINS: lambda a, b, _: str(b).lower() in str(a).lower() if a and b else False,
            Operator.STARTS_WITH: lambda a, b, _: str(a).lower().startswith(str(b).lower()) if a and b else False,
            Operator.IS_EMPTY: lambda a, _, __: a is None or a == "" or a == [],
            Operator.IS_NOT_EMPTY: lambda a, _, __: a is not None and a != "" and a != [],
        }
    
    def get_field_value(self, data: Dict[str, Any], field: str) -> Any:
        """Get nested field value using dot notation"""
        keys = field.split('.')
        value = data
        for key in keys:
            if isinstance(value, dict):
                value = value.get(key)
            else:
                return None
        return value
    
    def evaluate_condition(self, condition: Condition, data: Dict[str, Any]) -> bool:
        """Evaluate a single condition"""
        field_value = self.get_field_value(data, condition.field)
        operator_func = self.operators.get(condition.operator)
        
        if operator_func is None:
            logger.warning(f"Unknown operator: {condition.operator}")
            return False
        
        try:
            return operator_func(field_value, condition.value, condition.value2)
        except Exception as e:
            logger.error(f"Error evaluating condition: {e}")
            return False
    
    def evaluate_condition_group(self, group: ConditionGroup, data: Dict[str, Any]) -> bool:
        """Recursively evaluate a condition group"""
        if not group.conditions:
            return True
        
        results = []
        for item in group.conditions:
            if isinstance(item, ConditionGroup):
                result = self.evaluate_condition_group(item, data)
            elif isinstance(item, Condition):
                result = self.evaluate_condition(item, data)
            elif isinstance(item, dict):
                # Handle dict that might be either Condition or ConditionGroup
                if 'logical_operator' in item or 'conditions' in item:
                    cg = ConditionGroup(**item)
                    result = self.evaluate_condition_group(cg, data)
                else:
                    cond = Condition(**item)
                    result = self.evaluate_condition(cond, data)
            else:
                continue
            results.append(result)
        
        if group.logical_operator == LogicalOperator.AND:
            final_result = all(results) if results else True
        else:  # OR
            final_result = any(results) if results else False
        
        return not final_result if group.is_negated else final_result
    
    def is_rule_applicable(self, rule: Dict[str, Any], product_type: ProductType, current_case_type: CaseType) -> bool:
        """Check if rule is applicable based on product and case type"""
        # Check enabled status
        if not rule.get('is_enabled', True):
            return False
        
        # Check effective dates
        now = datetime.now(timezone.utc).isoformat()
        effective_from = rule.get('effective_from')
        effective_to = rule.get('effective_to')
        
        if effective_from and now < effective_from:
            return False
        if effective_to and now > effective_to:
            return False
        
        # Check product applicability
        products = rule.get('products', [])
        if products and product_type not in products and product_type.value not in products:
            return False
        
        # Check case type applicability
        case_types = rule.get('case_types', [])
        if case_types and current_case_type not in case_types and current_case_type.value not in case_types:
            return False
        
        return True

rule_engine = RuleEngine()

# ==================== HELPER FUNCTIONS ====================
async def log_audit(action: str, entity_type: str, entity_id: str, entity_name: str, changes: Dict = {}):
    """Log an audit entry"""
    audit = AuditLog(
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        entity_name=entity_name,
        changes=changes
    )
    await db.audit_logs.insert_one(audit.model_dump())

def get_case_type_label(case_type: CaseType) -> str:
    labels = {
        CaseType.NORMAL: "Normal Case",
        CaseType.DIRECT_ACCEPT: "Direct Accept",
        CaseType.DIRECT_FAIL: "Direct Fail",
        CaseType.GCRP: "GCRP Case"
    }
    return labels.get(case_type, "Unknown")

# ==================== API ROUTES ====================

# Health Check
@api_router.get("/")
async def root():
    return {"message": "Life Insurance STP & Underwriting Rule Engine API", "status": "healthy"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# ==================== RULE CRUD ====================
@api_router.post("/rules", response_model=Rule)
async def create_rule(rule_data: RuleCreate):
    rule = Rule(**rule_data.model_dump())
    doc = rule.model_dump()
    await db.rules.insert_one(doc)
    await log_audit("CREATE", "rule", rule.id, rule.name)
    return rule

@api_router.get("/rules", response_model=List[Rule])
async def get_rules(
    category: Optional[RuleCategory] = None,
    product: Optional[ProductType] = None,
    is_enabled: Optional[bool] = None,
    search: Optional[str] = None
):
    query = {}
    if category:
        query["category"] = category.value
    if product:
        query["products"] = {"$in": [product.value]}
    if is_enabled is not None:
        query["is_enabled"] = is_enabled
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    rules = await db.rules.find(query, {"_id": 0}).sort("priority", 1).to_list(1000)
    return rules

@api_router.get("/rules/{rule_id}", response_model=Rule)
async def get_rule(rule_id: str):
    rule = await db.rules.find_one({"id": rule_id}, {"_id": 0})
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule

@api_router.put("/rules/{rule_id}", response_model=Rule)
async def update_rule(rule_id: str, rule_data: RuleUpdate):
    existing = await db.rules.find_one({"id": rule_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    update_data = {k: v for k, v in rule_data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["version"] = existing.get("version", 1) + 1
    
    await db.rules.update_one({"id": rule_id}, {"$set": update_data})
    await log_audit("UPDATE", "rule", rule_id, existing.get("name", ""), update_data)
    
    updated = await db.rules.find_one({"id": rule_id}, {"_id": 0})
    return updated

@api_router.delete("/rules/{rule_id}")
async def delete_rule(rule_id: str):
    existing = await db.rules.find_one({"id": rule_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    await db.rules.delete_one({"id": rule_id})
    await log_audit("DELETE", "rule", rule_id, existing.get("name", ""))
    return {"message": "Rule deleted successfully"}

@api_router.patch("/rules/{rule_id}/toggle")
async def toggle_rule(rule_id: str):
    existing = await db.rules.find_one({"id": rule_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    new_status = not existing.get("is_enabled", True)
    await db.rules.update_one(
        {"id": rule_id},
        {"$set": {"is_enabled": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    await log_audit("TOGGLE", "rule", rule_id, existing.get("name", ""), {"is_enabled": new_status})
    return {"id": rule_id, "is_enabled": new_status}

# ==================== SCORECARD CRUD ====================
@api_router.post("/scorecards", response_model=Scorecard)
async def create_scorecard(scorecard_data: ScorecardCreate):
    scorecard = Scorecard(**scorecard_data.model_dump())
    doc = scorecard.model_dump()
    await db.scorecards.insert_one(doc)
    await log_audit("CREATE", "scorecard", scorecard.id, scorecard.name)
    return scorecard

@api_router.get("/scorecards", response_model=List[Scorecard])
async def get_scorecards(product: Optional[ProductType] = None):
    query = {}
    if product:
        query["product"] = product.value
    scorecards = await db.scorecards.find(query, {"_id": 0}).to_list(100)
    return scorecards

@api_router.get("/scorecards/{scorecard_id}", response_model=Scorecard)
async def get_scorecard(scorecard_id: str):
    scorecard = await db.scorecards.find_one({"id": scorecard_id}, {"_id": 0})
    if not scorecard:
        raise HTTPException(status_code=404, detail="Scorecard not found")
    return scorecard

@api_router.put("/scorecards/{scorecard_id}", response_model=Scorecard)
async def update_scorecard(scorecard_id: str, scorecard_data: ScorecardCreate):
    existing = await db.scorecards.find_one({"id": scorecard_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Scorecard not found")
    
    update_data = scorecard_data.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.scorecards.update_one({"id": scorecard_id}, {"$set": update_data})
    await log_audit("UPDATE", "scorecard", scorecard_id, existing.get("name", ""))
    
    updated = await db.scorecards.find_one({"id": scorecard_id}, {"_id": 0})
    return updated

@api_router.delete("/scorecards/{scorecard_id}")
async def delete_scorecard(scorecard_id: str):
    existing = await db.scorecards.find_one({"id": scorecard_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Scorecard not found")
    
    await db.scorecards.delete_one({"id": scorecard_id})
    await log_audit("DELETE", "scorecard", scorecard_id, existing.get("name", ""))
    return {"message": "Scorecard deleted successfully"}

# ==================== GRID CRUD ====================
@api_router.post("/grids", response_model=Grid)
async def create_grid(grid_data: GridCreate):
    grid = Grid(**grid_data.model_dump())
    doc = grid.model_dump()
    await db.grids.insert_one(doc)
    await log_audit("CREATE", "grid", grid.id, grid.name)
    return grid

@api_router.get("/grids", response_model=List[Grid])
async def get_grids(grid_type: Optional[str] = None, product: Optional[ProductType] = None):
    query = {}
    if grid_type:
        query["grid_type"] = grid_type
    if product:
        query["products"] = {"$in": [product.value]}
    grids = await db.grids.find(query, {"_id": 0}).to_list(100)
    return grids

@api_router.get("/grids/{grid_id}", response_model=Grid)
async def get_grid(grid_id: str):
    grid = await db.grids.find_one({"id": grid_id}, {"_id": 0})
    if not grid:
        raise HTTPException(status_code=404, detail="Grid not found")
    return grid

@api_router.put("/grids/{grid_id}", response_model=Grid)
async def update_grid(grid_id: str, grid_data: GridCreate):
    existing = await db.grids.find_one({"id": grid_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Grid not found")
    
    update_data = grid_data.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.grids.update_one({"id": grid_id}, {"$set": update_data})
    await log_audit("UPDATE", "grid", grid_id, existing.get("name", ""))
    
    updated = await db.grids.find_one({"id": grid_id}, {"_id": 0})
    return updated

@api_router.delete("/grids/{grid_id}")
async def delete_grid(grid_id: str):
    existing = await db.grids.find_one({"id": grid_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Grid not found")
    
    await db.grids.delete_one({"id": grid_id})
    await log_audit("DELETE", "grid", grid_id, existing.get("name", ""))
    return {"message": "Grid deleted successfully"}

# ==================== PRODUCT CRUD ====================
@api_router.post("/products", response_model=Product)
async def create_product(product_data: ProductCreate):
    product = Product(**product_data.model_dump())
    doc = product.model_dump()
    await db.products.insert_one(doc)
    await log_audit("CREATE", "product", product.id, product.name)
    return product

@api_router.get("/products", response_model=List[Product])
async def get_products(product_type: Optional[ProductType] = None):
    query = {}
    if product_type:
        query["product_type"] = product_type.value
    products = await db.products.find(query, {"_id": 0}).to_list(100)
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductCreate):
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_data.model_dump()
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    await log_audit("UPDATE", "product", product_id, existing.get("name", ""))
    
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    return updated

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await db.products.delete_one({"id": product_id})
    await log_audit("DELETE", "product", product_id, existing.get("name", ""))
    return {"message": "Product deleted successfully"}

# ==================== UNDERWRITING EVALUATION ====================
@api_router.post("/underwriting/evaluate", response_model=EvaluationResult)
async def evaluate_proposal(proposal: ProposalData):
    import time
    start_time = time.time()
    
    # Initialize result variables
    stp_decision = "PASS"
    case_type = CaseType.NORMAL
    reason_flag = ReasonFlag.STP_PASS_SKIP
    scorecard_value = 0
    triggered_rules = []
    validation_errors = []
    reason_codes = []
    reason_messages = []
    rule_trace = []
    
    # Convert proposal to dict for rule evaluation
    proposal_dict = proposal.model_dump()
    
    # Fetch all rules sorted by priority
    rules = await db.rules.find({"is_enabled": True}, {"_id": 0}).sort("priority", 1).to_list(1000)
    
    # Phase 1: Validation Rules
    validation_rules = [r for r in rules if r.get("category") == RuleCategory.VALIDATION.value]
    for rule in validation_rules:
        rule_start = time.time()
        
        if not rule_engine.is_rule_applicable(rule, proposal.product_type, case_type):
            continue
        
        condition_group = ConditionGroup(**rule.get("condition_group", {}))
        triggered = rule_engine.evaluate_condition_group(condition_group, proposal_dict)
        
        trace_entry = RuleExecutionTrace(
            rule_id=rule["id"],
            rule_name=rule["name"],
            category=rule["category"],
            triggered=triggered,
            input_values={cond.get("field", ""): rule_engine.get_field_value(proposal_dict, cond.get("field", "")) 
                         for cond in rule.get("condition_group", {}).get("conditions", []) if isinstance(cond, dict) and "field" in cond},
            condition_result=triggered,
            action_applied=rule.get("action") if triggered else None,
            execution_time_ms=(time.time() - rule_start) * 1000
        )
        rule_trace.append(trace_entry)
        
        if triggered:
            action = rule.get("action", {})
            if action.get("reason_message"):
                validation_errors.append(action["reason_message"])
            if action.get("reason_code"):
                reason_codes.append(action["reason_code"])
            triggered_rules.append(rule["name"])
            
            if action.get("is_hard_stop"):
                stp_decision = "FAIL"
                case_type = CaseType.DIRECT_FAIL
                reason_flag = ReasonFlag.STP_FAIL_PRINT
    
    # Phase 2: STP Decision Rules
    if stp_decision == "PASS":
        stp_rules = [r for r in rules if r.get("category") == RuleCategory.STP_DECISION.value]
        for rule in stp_rules:
            rule_start = time.time()
            
            if not rule_engine.is_rule_applicable(rule, proposal.product_type, case_type):
                continue
            
            condition_group = ConditionGroup(**rule.get("condition_group", {}))
            triggered = rule_engine.evaluate_condition_group(condition_group, proposal_dict)
            
            trace_entry = RuleExecutionTrace(
                rule_id=rule["id"],
                rule_name=rule["name"],
                category=rule["category"],
                triggered=triggered,
                input_values={cond.get("field", ""): rule_engine.get_field_value(proposal_dict, cond.get("field", "")) 
                             for cond in rule.get("condition_group", {}).get("conditions", []) if isinstance(cond, dict) and "field" in cond},
                condition_result=triggered,
                action_applied=rule.get("action") if triggered else None,
                execution_time_ms=(time.time() - rule_start) * 1000
            )
            rule_trace.append(trace_entry)
            
            if triggered:
                action = rule.get("action", {})
                triggered_rules.append(rule["name"])
                
                if action.get("decision") == "FAIL":
                    stp_decision = "FAIL"
                    reason_flag = ReasonFlag.STP_FAIL_PRINT
                    
                if action.get("reason_code"):
                    reason_codes.append(action["reason_code"])
                if action.get("reason_message"):
                    reason_messages.append(action["reason_message"])
                    
                if action.get("is_hard_stop"):
                    case_type = CaseType.DIRECT_FAIL
                    break
    
    # Phase 3: Scorecard Evaluation
    scorecards = await db.scorecards.find(
        {"product": proposal.product_type.value, "is_enabled": True}, 
        {"_id": 0}
    ).to_list(10)
    
    for scorecard in scorecards:
        for param in scorecard.get("parameters", []):
            field_value = rule_engine.get_field_value(proposal_dict, param.get("field", ""))
            for band in param.get("bands", []):
                min_val = band.get("min", float("-inf"))
                max_val = band.get("max", float("inf"))
                try:
                    if min_val <= float(field_value) <= max_val:
                        scorecard_value += int(band.get("score", 0) * param.get("weight", 1))
                        break
                except (ValueError, TypeError):
                    pass
        
        # Determine case type based on scorecard thresholds
        if scorecard_value >= scorecard.get("threshold_direct_accept", 80):
            if case_type == CaseType.NORMAL:
                case_type = CaseType.DIRECT_ACCEPT
        elif scorecard_value < scorecard.get("threshold_refer", 30):
            case_type = CaseType.GCRP
    
    # Phase 4: Case Type Rules
    case_type_rules = [r for r in rules if r.get("category") == RuleCategory.CASE_TYPE.value]
    for rule in case_type_rules:
        rule_start = time.time()
        
        if not rule_engine.is_rule_applicable(rule, proposal.product_type, case_type):
            continue
        
        condition_group = ConditionGroup(**rule.get("condition_group", {}))
        triggered = rule_engine.evaluate_condition_group(condition_group, proposal_dict)
        
        trace_entry = RuleExecutionTrace(
            rule_id=rule["id"],
            rule_name=rule["name"],
            category=rule["category"],
            triggered=triggered,
            input_values={cond.get("field", ""): rule_engine.get_field_value(proposal_dict, cond.get("field", "")) 
                         for cond in rule.get("condition_group", {}).get("conditions", []) if isinstance(cond, dict) and "field" in cond},
            condition_result=triggered,
            action_applied=rule.get("action") if triggered else None,
            execution_time_ms=(time.time() - rule_start) * 1000
        )
        rule_trace.append(trace_entry)
        
        if triggered:
            action = rule.get("action", {})
            triggered_rules.append(rule["name"])
            
            if action.get("case_type") is not None:
                case_type = CaseType(action["case_type"])
            
            if action.get("reason_code"):
                reason_codes.append(action["reason_code"])
            if action.get("reason_message"):
                reason_messages.append(action["reason_message"])
    
    # Phase 5: Grid Evaluations (BMI, Income×SA, Occupation)
    grids = await db.grids.find({"is_enabled": True}, {"_id": 0}).to_list(100)
    
    for grid in grids:
        if grid.get("products") and proposal.product_type.value not in grid.get("products", []):
            continue
        
        row_value = str(rule_engine.get_field_value(proposal_dict, grid.get("row_field", "")))
        col_value = str(rule_engine.get_field_value(proposal_dict, grid.get("col_field", "")))
        
        # Find matching cell
        for cell in grid.get("cells", []):
            if cell.get("row_value") == row_value and cell.get("col_value") == col_value:
                if cell.get("result") == "DECLINE":
                    stp_decision = "FAIL"
                    case_type = CaseType.DIRECT_FAIL
                    reason_flag = ReasonFlag.STP_FAIL_PRINT
                    reason_messages.append(f"Grid {grid['name']}: {row_value} × {col_value} = DECLINE")
                elif cell.get("result") == "REFER":
                    case_type = CaseType.GCRP
                    reason_messages.append(f"Grid {grid['name']}: {row_value} × {col_value} = REFER")
                
                if cell.get("score_impact"):
                    scorecard_value += cell["score_impact"]
                break
    
    # Calculate total execution time
    execution_time = (time.time() - start_time) * 1000
    
    # Build result
    result = EvaluationResult(
        proposal_id=proposal.proposal_id,
        stp_decision=stp_decision,
        case_type=case_type,
        case_type_label=get_case_type_label(case_type),
        reason_flag=reason_flag,
        scorecard_value=scorecard_value,
        triggered_rules=triggered_rules,
        validation_errors=validation_errors,
        reason_codes=list(set(reason_codes)),
        reason_messages=list(set(reason_messages)),
        rule_trace=rule_trace,
        evaluation_time_ms=round(execution_time, 2),
        evaluated_at=datetime.now(timezone.utc).isoformat()
    )
    
    # Store evaluation result for audit
    eval_doc = result.model_dump()
    eval_doc["id"] = str(uuid.uuid4())
    await db.evaluations.insert_one(eval_doc)
    
    return result

# ==================== AUDIT LOGS ====================
@api_router.get("/audit-logs", response_model=List[AuditLog])
async def get_audit_logs(
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = Query(default=100, le=500)
):
    query = {}
    if entity_type:
        query["entity_type"] = entity_type
    if action:
        query["action"] = action
    
    logs = await db.audit_logs.find(query, {"_id": 0}).sort("performed_at", -1).to_list(limit)
    return logs

# ==================== EVALUATION HISTORY ====================
@api_router.get("/evaluations")
async def get_evaluations(
    stp_decision: Optional[str] = None,
    limit: int = Query(default=100, le=500)
):
    query = {}
    if stp_decision:
        query["stp_decision"] = stp_decision
    
    evaluations = await db.evaluations.find(query, {"_id": 0}).sort("evaluated_at", -1).to_list(limit)
    return evaluations

@api_router.get("/evaluations/{evaluation_id}")
async def get_evaluation(evaluation_id: str):
    evaluation = await db.evaluations.find_one({"id": evaluation_id}, {"_id": 0})
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return evaluation

# ==================== DASHBOARD STATS ====================
@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    # Get counts
    total_rules = await db.rules.count_documents({})
    active_rules = await db.rules.count_documents({"is_enabled": True})
    total_evaluations = await db.evaluations.count_documents({})
    stp_pass = await db.evaluations.count_documents({"stp_decision": "PASS"})
    stp_fail = await db.evaluations.count_documents({"stp_decision": "FAIL"})
    
    # Calculate STP rate
    stp_rate = (stp_pass / total_evaluations * 100) if total_evaluations > 0 else 0
    
    # Get rule category distribution
    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    category_dist = await db.rules.aggregate(pipeline).to_list(20)
    
    # Get recent evaluations
    recent_evals = await db.evaluations.find({}, {"_id": 0}).sort("evaluated_at", -1).to_list(10)
    
    return {
        "total_rules": total_rules,
        "active_rules": active_rules,
        "inactive_rules": total_rules - active_rules,
        "total_evaluations": total_evaluations,
        "stp_pass": stp_pass,
        "stp_fail": stp_fail,
        "stp_rate": round(stp_rate, 2),
        "category_distribution": [{"category": item["_id"], "count": item["count"]} for item in category_dist],
        "recent_evaluations": recent_evals
    }

# ==================== SEED DATA ====================
@api_router.post("/seed")
async def seed_sample_data():
    """Seed sample rules, scorecards, grids, and products"""
    
    # Clear existing data
    await db.rules.delete_many({})
    await db.scorecards.delete_many({})
    await db.grids.delete_many({})
    await db.products.delete_many({})
    
    # Sample Products
    products = [
        {
            "id": str(uuid.uuid4()),
            "code": "TERM001",
            "name": "Term Life Protect",
            "product_type": "term_life",
            "description": "Pure term life insurance with death benefit",
            "min_age": 18,
            "max_age": 65,
            "min_sum_assured": 500000,
            "max_sum_assured": 50000000,
            "min_premium": 5000,
            "is_enabled": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "code": "ENDOW001",
            "name": "Endowment Savings Plan",
            "product_type": "endowment",
            "description": "Endowment plan with maturity benefit",
            "min_age": 18,
            "max_age": 55,
            "min_sum_assured": 100000,
            "max_sum_assured": 10000000,
            "min_premium": 10000,
            "is_enabled": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "code": "ULIP001",
            "name": "ULIP Growth Fund",
            "product_type": "ulip",
            "description": "Unit linked insurance plan with market-linked returns",
            "min_age": 18,
            "max_age": 60,
            "min_sum_assured": 250000,
            "max_sum_assured": 25000000,
            "min_premium": 25000,
            "is_enabled": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.products.insert_many(products)
    
    # Sample Validation Rules
    validation_rules = [
        {
            "id": str(uuid.uuid4()),
            "name": "Missing Income Validation",
            "description": "Check if applicant income is provided",
            "category": "validation",
            "condition_group": {
                "logical_operator": "OR",
                "conditions": [
                    {"field": "applicant_income", "operator": "is_empty", "value": None},
                    {"field": "applicant_income", "operator": "less_than_or_equal", "value": 0}
                ],
                "is_negated": False
            },
            "action": {
                "decision": "FAIL",
                "reason_code": "VAL001",
                "reason_message": "Applicant income is missing or invalid",
                "is_hard_stop": True
            },
            "priority": 10,
            "is_enabled": True,
            "products": ["term_life", "endowment", "ulip"],
            "case_types": [],
            "version": 1,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Missing Premium Validation",
            "description": "Check if premium is provided and valid",
            "category": "validation",
            "condition_group": {
                "logical_operator": "OR",
                "conditions": [
                    {"field": "premium", "operator": "is_empty", "value": None},
                    {"field": "premium", "operator": "less_than_or_equal", "value": 0}
                ],
                "is_negated": False
            },
            "action": {
                "decision": "FAIL",
                "reason_code": "VAL002",
                "reason_message": "Premium amount is missing or invalid",
                "is_hard_stop": True
            },
            "priority": 10,
            "is_enabled": True,
            "products": ["term_life", "endowment", "ulip"],
            "case_types": [],
            "version": 1,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Age Eligibility Check",
            "description": "Validate applicant age is within acceptable range",
            "category": "validation",
            "condition_group": {
                "logical_operator": "OR",
                "conditions": [
                    {"field": "applicant_age", "operator": "less_than", "value": 18},
                    {"field": "applicant_age", "operator": "greater_than", "value": 70}
                ],
                "is_negated": False
            },
            "action": {
                "decision": "FAIL",
                "reason_code": "VAL003",
                "reason_message": "Applicant age must be between 18 and 70 years",
                "is_hard_stop": True
            },
            "priority": 10,
            "is_enabled": True,
            "products": ["term_life", "endowment", "ulip"],
            "case_types": [],
            "version": 1,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Sample STP Decision Rules
    stp_rules = [
        {
            "id": str(uuid.uuid4()),
            "name": "High Sum Assured Check",
            "description": "Flag high sum assured for medical underwriting",
            "category": "stp_decision",
            "condition_group": {
                "logical_operator": "AND",
                "conditions": [
                    {"field": "sum_assured", "operator": "greater_than", "value": 10000000}
                ],
                "is_negated": False
            },
            "action": {
                "decision": "FAIL",
                "reason_code": "STP001",
                "reason_message": "Sum assured exceeds STP limit - Medical required",
                "is_hard_stop": False
            },
            "priority": 20,
            "is_enabled": True,
            "products": ["term_life"],
            "case_types": [],
            "version": 1,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Smoker High Risk",
            "description": "Flag smokers with high sum assured",
            "category": "stp_decision",
            "condition_group": {
                "logical_operator": "AND",
                "conditions": [
                    {"field": "is_smoker", "operator": "equals", "value": True},
                    {"field": "sum_assured", "operator": "greater_than", "value": 5000000}
                ],
                "is_negated": False
            },
            "action": {
                "decision": "FAIL",
                "reason_code": "STP002",
                "reason_message": "Smoker with high coverage - Additional underwriting required",
                "is_hard_stop": False
            },
            "priority": 25,
            "is_enabled": True,
            "products": ["term_life", "endowment"],
            "case_types": [],
            "version": 1,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Medical History Check",
            "description": "Flag applicants with medical history",
            "category": "stp_decision",
            "condition_group": {
                "logical_operator": "AND",
                "conditions": [
                    {"field": "has_medical_history", "operator": "equals", "value": True}
                ],
                "is_negated": False
            },
            "action": {
                "decision": "FAIL",
                "reason_code": "STP003",
                "reason_message": "Medical history present - Underwriter review required",
                "is_hard_stop": False
            },
            "priority": 30,
            "is_enabled": True,
            "products": ["term_life", "endowment", "ulip"],
            "case_types": [],
            "version": 1,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Sample Case Type Rules
    case_type_rules = [
        {
            "id": str(uuid.uuid4()),
            "name": "Low Risk Direct Accept",
            "description": "Direct accept for low risk profiles",
            "category": "case_type",
            "condition_group": {
                "logical_operator": "AND",
                "conditions": [
                    {"field": "applicant_age", "operator": "between", "value": 25, "value2": 45},
                    {"field": "is_smoker", "operator": "equals", "value": False},
                    {"field": "has_medical_history", "operator": "equals", "value": False},
                    {"field": "sum_assured", "operator": "less_than_or_equal", "value": 5000000}
                ],
                "is_negated": False
            },
            "action": {
                "case_type": 1,
                "reason_code": "CT001",
                "reason_message": "Low risk profile - Direct Accept"
            },
            "priority": 50,
            "is_enabled": True,
            "products": ["term_life", "endowment"],
            "case_types": [0],
            "version": 1,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "GCRP Referral",
            "description": "Refer to GCRP for specific conditions",
            "category": "case_type",
            "condition_group": {
                "logical_operator": "OR",
                "conditions": [
                    {"field": "occupation_risk", "operator": "equals", "value": "high"},
                    {"field": "applicant_age", "operator": "greater_than", "value": 55}
                ],
                "is_negated": False
            },
            "action": {
                "case_type": 3,
                "reason_code": "CT002",
                "reason_message": "Referred to GCRP for additional review"
            },
            "priority": 60,
            "is_enabled": True,
            "products": ["term_life", "endowment", "ulip"],
            "case_types": [0],
            "version": 1,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Sample Scorecard Rules
    scorecard_rules = [
        {
            "id": str(uuid.uuid4()),
            "name": "Age Score - Young Adult Bonus",
            "description": "Bonus score for young adults",
            "category": "scorecard",
            "condition_group": {
                "logical_operator": "AND",
                "conditions": [
                    {"field": "applicant_age", "operator": "between", "value": 25, "value2": 35}
                ],
                "is_negated": False
            },
            "action": {
                "score_impact": 15,
                "reason_code": "SC001",
                "reason_message": "Age bonus: 25-35 years"
            },
            "priority": 100,
            "is_enabled": True,
            "products": ["term_life", "endowment", "ulip"],
            "case_types": [],
            "version": 1,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Non-Smoker Bonus",
            "description": "Bonus score for non-smokers",
            "category": "scorecard",
            "condition_group": {
                "logical_operator": "AND",
                "conditions": [
                    {"field": "is_smoker", "operator": "equals", "value": False}
                ],
                "is_negated": False
            },
            "action": {
                "score_impact": 20,
                "reason_code": "SC002",
                "reason_message": "Non-smoker bonus"
            },
            "priority": 100,
            "is_enabled": True,
            "products": ["term_life", "endowment"],
            "case_types": [],
            "version": 1,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    all_rules = validation_rules + stp_rules + case_type_rules + scorecard_rules
    await db.rules.insert_many(all_rules)
    
    # Sample Scorecards
    scorecards = [
        {
            "id": str(uuid.uuid4()),
            "name": "Term Life Scorecard",
            "description": "Primary scorecard for term life products",
            "product": "term_life",
            "parameters": [
                {
                    "id": str(uuid.uuid4()),
                    "name": "Age Band",
                    "field": "applicant_age",
                    "weight": 1.0,
                    "bands": [
                        {"min": 18, "max": 30, "score": 20, "label": "18-30"},
                        {"min": 31, "max": 40, "score": 15, "label": "31-40"},
                        {"min": 41, "max": 50, "score": 10, "label": "41-50"},
                        {"min": 51, "max": 60, "score": 5, "label": "51-60"},
                        {"min": 61, "max": 70, "score": 0, "label": "61-70"}
                    ]
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "Income Band",
                    "field": "applicant_income",
                    "weight": 1.0,
                    "bands": [
                        {"min": 0, "max": 500000, "score": 5, "label": "0-5L"},
                        {"min": 500001, "max": 1000000, "score": 10, "label": "5L-10L"},
                        {"min": 1000001, "max": 2500000, "score": 15, "label": "10L-25L"},
                        {"min": 2500001, "max": 5000000, "score": 18, "label": "25L-50L"},
                        {"min": 5000001, "max": 999999999, "score": 20, "label": "50L+"}
                    ]
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "BMI Band",
                    "field": "bmi",
                    "weight": 0.8,
                    "bands": [
                        {"min": 0, "max": 18.5, "score": 5, "label": "Underweight"},
                        {"min": 18.5, "max": 25, "score": 15, "label": "Normal"},
                        {"min": 25, "max": 30, "score": 10, "label": "Overweight"},
                        {"min": 30, "max": 35, "score": 5, "label": "Obese I"},
                        {"min": 35, "max": 100, "score": 0, "label": "Obese II+"}
                    ]
                }
            ],
            "threshold_direct_accept": 80,
            "threshold_normal": 50,
            "threshold_refer": 30,
            "is_enabled": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.scorecards.insert_many(scorecards)
    
    # Sample Grids
    grids = [
        {
            "id": str(uuid.uuid4()),
            "name": "BMI Risk Grid",
            "description": "BMI-based risk assessment grid",
            "grid_type": "bmi",
            "row_field": "bmi",
            "col_field": "applicant_age",
            "row_labels": ["<18.5", "18.5-25", "25-30", "30-35", ">35"],
            "col_labels": ["18-30", "31-45", "46-55", "56-65", ">65"],
            "cells": [
                {"row_value": "<18.5", "col_value": "18-30", "result": "ACCEPT", "score_impact": 0},
                {"row_value": "18.5-25", "col_value": "18-30", "result": "ACCEPT", "score_impact": 10},
                {"row_value": "25-30", "col_value": "18-30", "result": "ACCEPT", "score_impact": 5},
                {"row_value": "30-35", "col_value": "18-30", "result": "REFER", "score_impact": -5},
                {"row_value": ">35", "col_value": "18-30", "result": "DECLINE", "score_impact": -20}
            ],
            "products": ["term_life", "endowment", "ulip"],
            "is_enabled": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Income × Sum Assured Grid",
            "description": "Income to Sum Assured eligibility grid",
            "grid_type": "income_sa",
            "row_field": "applicant_income",
            "col_field": "sum_assured",
            "row_labels": ["<5L", "5L-10L", "10L-25L", "25L-50L", ">50L"],
            "col_labels": ["<25L", "25L-50L", "50L-1Cr", "1Cr-2Cr", ">2Cr"],
            "cells": [
                {"row_value": "<5L", "col_value": "<25L", "result": "ACCEPT", "score_impact": 0},
                {"row_value": "<5L", "col_value": "25L-50L", "result": "REFER", "score_impact": -5},
                {"row_value": "<5L", "col_value": "50L-1Cr", "result": "DECLINE", "score_impact": -20},
                {"row_value": "5L-10L", "col_value": "<25L", "result": "ACCEPT", "score_impact": 5},
                {"row_value": "5L-10L", "col_value": "25L-50L", "result": "ACCEPT", "score_impact": 0},
                {"row_value": "5L-10L", "col_value": "50L-1Cr", "result": "REFER", "score_impact": -5}
            ],
            "products": ["term_life", "endowment", "ulip"],
            "is_enabled": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.grids.insert_many(grids)
    
    return {
        "message": "Sample data seeded successfully",
        "products": len(products),
        "rules": len(all_rules),
        "scorecards": len(scorecards),
        "grids": len(grids)
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
