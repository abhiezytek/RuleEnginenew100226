from fastapi import FastAPI, APIRouter, HTTPException, Query, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any, Union
import uuid
from datetime import datetime, timezone
from enum import Enum
import json

from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, Text, DateTime, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# SQLite connection (can be replaced with MySQL/PostgreSQL)
DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///./insurance_stp.db')

# Create engine and session
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

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
class RuleCategoryEnum(str, Enum):
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

class OperatorEnum(str, Enum):
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

class LogicalOperatorEnum(str, Enum):
    AND = "AND"
    OR = "OR"

class CaseTypeEnum(int, Enum):
    NORMAL = 0
    DIRECT_ACCEPT = 1
    DIRECT_FAIL = -1
    GCRP = 3

class ReasonFlagEnum(int, Enum):
    STP_FAIL_PRINT = 1
    STP_PASS_SKIP = 0
    NOT_PROVIDED = -1

class ProductTypeEnum(str, Enum):
    TERM_LIFE = "term_life"
    ENDOWMENT = "endowment"
    ULIP = "ulip"

# ==================== SQLAlchemy MODELS ====================
class RuleModel(Base):
    __tablename__ = "rules"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False)
    stage_id = Column(String(36), nullable=True)  # Foreign key to rule_stages
    condition_group = Column(JSON, nullable=False)
    action = Column(JSON, nullable=False)
    priority = Column(Integer, default=100)
    is_enabled = Column(Boolean, default=True)
    effective_from = Column(String(50), nullable=True)
    effective_to = Column(String(50), nullable=True)
    products = Column(JSON, default=list)
    case_types = Column(JSON, default=list)
    version = Column(Integer, default=1)
    created_at = Column(String(50), default=lambda: datetime.now(timezone.utc).isoformat())
    updated_at = Column(String(50), default=lambda: datetime.now(timezone.utc).isoformat())

class RuleStageModel(Base):
    __tablename__ = "rule_stages"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    execution_order = Column(Integer, default=1)  # Lower = earlier execution
    stop_on_fail = Column(Boolean, default=False)  # Stop evaluation if any rule in stage fails
    color = Column(String(20), default="slate")  # UI color
    is_enabled = Column(Boolean, default=True)
    created_at = Column(String(50), default=lambda: datetime.now(timezone.utc).isoformat())
    updated_at = Column(String(50), default=lambda: datetime.now(timezone.utc).isoformat())

class ScorecardModel(Base):
    __tablename__ = "scorecards"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    product = Column(String(50), nullable=False)
    parameters = Column(JSON, default=list)
    threshold_direct_accept = Column(Integer, default=80)
    threshold_normal = Column(Integer, default=50)
    threshold_refer = Column(Integer, default=30)
    is_enabled = Column(Boolean, default=True)
    created_at = Column(String(50), default=lambda: datetime.now(timezone.utc).isoformat())
    updated_at = Column(String(50), default=lambda: datetime.now(timezone.utc).isoformat())

class GridModel(Base):
    __tablename__ = "grids"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    grid_type = Column(String(50), nullable=False)
    row_field = Column(String(100), nullable=False)
    col_field = Column(String(100), nullable=False)
    row_labels = Column(JSON, default=list)
    col_labels = Column(JSON, default=list)
    cells = Column(JSON, default=list)
    products = Column(JSON, default=list)
    is_enabled = Column(Boolean, default=True)
    created_at = Column(String(50), default=lambda: datetime.now(timezone.utc).isoformat())
    updated_at = Column(String(50), default=lambda: datetime.now(timezone.utc).isoformat())

class ProductModel(Base):
    __tablename__ = "products"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    product_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    min_age = Column(Integer, default=18)
    max_age = Column(Integer, default=65)
    min_sum_assured = Column(Integer, default=100000)
    max_sum_assured = Column(Integer, default=10000000)
    min_premium = Column(Integer, default=1000)
    is_enabled = Column(Boolean, default=True)
    created_at = Column(String(50), default=lambda: datetime.now(timezone.utc).isoformat())

class EvaluationModel(Base):
    __tablename__ = "evaluations"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    proposal_id = Column(String(100), nullable=False)
    stp_decision = Column(String(10), nullable=False)
    case_type = Column(Integer, nullable=False)
    case_type_label = Column(String(50), nullable=False)
    reason_flag = Column(Integer, nullable=False)
    scorecard_value = Column(Integer, default=0)
    triggered_rules = Column(JSON, default=list)
    validation_errors = Column(JSON, default=list)
    reason_codes = Column(JSON, default=list)
    reason_messages = Column(JSON, default=list)
    rule_trace = Column(JSON, default=list)
    evaluation_time_ms = Column(Float, default=0)
    evaluated_at = Column(String(50), default=lambda: datetime.now(timezone.utc).isoformat())

class AuditLogModel(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    action = Column(String(50), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(36), nullable=False)
    entity_name = Column(String(255), nullable=False)
    changes = Column(JSON, default=dict)
    performed_by = Column(String(100), default="system")
    performed_at = Column(String(50), default=lambda: datetime.now(timezone.utc).isoformat())

# Create tables
def init_db():
    Base.metadata.create_all(bind=engine)

# Dependency for DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==================== PYDANTIC MODELS ====================
class Condition(BaseModel):
    field: str
    operator: OperatorEnum
    value: Any
    value2: Optional[Any] = None

class ConditionGroup(BaseModel):
    logical_operator: LogicalOperatorEnum = LogicalOperatorEnum.AND
    conditions: List[Union['ConditionGroup', Condition]] = []
    is_negated: bool = False

ConditionGroup.model_rebuild()

class RuleAction(BaseModel):
    decision: Optional[str] = None
    score_impact: Optional[int] = None
    case_type: Optional[CaseTypeEnum] = None
    reason_code: Optional[str] = None
    reason_message: Optional[str] = None
    is_hard_stop: bool = False

class RuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: RuleCategoryEnum
    stage_id: Optional[str] = None
    condition_group: ConditionGroup
    action: RuleAction
    priority: int = 100
    is_enabled: bool = True
    effective_from: Optional[str] = None
    effective_to: Optional[str] = None
    products: List[ProductTypeEnum] = []
    case_types: List[CaseTypeEnum] = []

class RuleResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    category: str
    stage_id: Optional[str] = None
    stage_name: Optional[str] = None
    condition_group: Dict[str, Any]
    action: Dict[str, Any]
    priority: int
    is_enabled: bool
    effective_from: Optional[str] = None
    effective_to: Optional[str] = None
    products: List[str]
    case_types: List[int]
    version: int
    created_at: str
    updated_at: str

class RuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[RuleCategoryEnum] = None
    stage_id: Optional[str] = None
    condition_group: Optional[ConditionGroup] = None
    action: Optional[RuleAction] = None
    priority: Optional[int] = None
    is_enabled: Optional[bool] = None
    effective_from: Optional[str] = None
    effective_to: Optional[str] = None
    products: Optional[List[ProductTypeEnum]] = None
    case_types: Optional[List[CaseTypeEnum]] = None

# Rule Stage Models
class RuleStageCreate(BaseModel):
    name: str
    description: Optional[str] = None
    execution_order: int = 1
    stop_on_fail: bool = False
    color: str = "slate"
    is_enabled: bool = True

class RuleStageResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    execution_order: int
    stop_on_fail: bool
    color: str
    is_enabled: bool
    rule_count: int = 0
    created_at: str
    updated_at: str

class RuleStageUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    execution_order: Optional[int] = None
    stop_on_fail: Optional[bool] = None
    color: Optional[str] = None
    is_enabled: Optional[bool] = None

class StageExecutionTrace(BaseModel):
    stage_id: str
    stage_name: str
    execution_order: int
    status: str  # passed, failed, skipped
    rules_executed: List['RuleExecutionTrace'] = []
    triggered_rules_count: int
    execution_time_ms: float

class ScorecardParameter(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    field: str
    weight: float = 1.0
    bands: List[Dict[str, Any]] = []

class ScorecardCreate(BaseModel):
    name: str
    description: Optional[str] = None
    product: ProductTypeEnum
    parameters: List[ScorecardParameter] = []
    threshold_direct_accept: int = 80
    threshold_normal: int = 50
    threshold_refer: int = 30
    is_enabled: bool = True

class GridCell(BaseModel):
    row_value: str
    col_value: str
    result: str
    score_impact: Optional[int] = None

class GridCreate(BaseModel):
    name: str
    description: Optional[str] = None
    grid_type: str
    row_field: str
    col_field: str
    row_labels: List[str] = []
    col_labels: List[str] = []
    cells: List[GridCell] = []
    products: List[ProductTypeEnum] = []
    is_enabled: bool = True

class ProductCreate(BaseModel):
    code: str
    name: str
    product_type: ProductTypeEnum
    description: Optional[str] = None
    min_age: int = 18
    max_age: int = 65
    min_sum_assured: int = 100000
    max_sum_assured: int = 10000000
    min_premium: int = 1000
    is_enabled: bool = True

class ProposalData(BaseModel):
    proposal_id: str
    product_code: str
    product_type: ProductTypeEnum
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
    stp_decision: str
    case_type: CaseTypeEnum
    case_type_label: str
    reason_flag: ReasonFlagEnum
    scorecard_value: int
    triggered_rules: List[str]
    validation_errors: List[str]
    reason_codes: List[str]
    reason_messages: List[str]
    rule_trace: List[RuleExecutionTrace]
    stage_trace: List[StageExecutionTrace] = []
    evaluation_time_ms: float
    evaluated_at: str

# ==================== RULE ENGINE ====================
class RuleEngine:
    def __init__(self):
        self.operators = {
            OperatorEnum.EQUALS: lambda a, b, _: a == b,
            OperatorEnum.NOT_EQUALS: lambda a, b, _: a != b,
            OperatorEnum.GREATER_THAN: lambda a, b, _: float(a) > float(b) if a is not None and b is not None else False,
            OperatorEnum.LESS_THAN: lambda a, b, _: float(a) < float(b) if a is not None and b is not None else False,
            OperatorEnum.GREATER_THAN_OR_EQUAL: lambda a, b, _: float(a) >= float(b) if a is not None and b is not None else False,
            OperatorEnum.LESS_THAN_OR_EQUAL: lambda a, b, _: float(a) <= float(b) if a is not None and b is not None else False,
            OperatorEnum.IN: lambda a, b, _: a in b if isinstance(b, list) else a == b,
            OperatorEnum.NOT_IN: lambda a, b, _: a not in b if isinstance(b, list) else a != b,
            OperatorEnum.BETWEEN: lambda a, b, c: float(b) <= float(a) <= float(c) if a is not None and b is not None and c is not None else False,
            OperatorEnum.CONTAINS: lambda a, b, _: str(b).lower() in str(a).lower() if a and b else False,
            OperatorEnum.STARTS_WITH: lambda a, b, _: str(a).lower().startswith(str(b).lower()) if a and b else False,
            OperatorEnum.IS_EMPTY: lambda a, _, __: a is None or a == "" or a == [],
            OperatorEnum.IS_NOT_EMPTY: lambda a, _, __: a is not None and a != "" and a != [],
        }
    
    def get_field_value(self, data: Dict[str, Any], field: str) -> Any:
        keys = field.split('.')
        value = data
        for key in keys:
            if isinstance(value, dict):
                value = value.get(key)
            else:
                return None
        return value
    
    def evaluate_condition(self, condition: Dict, data: Dict[str, Any]) -> bool:
        field_value = self.get_field_value(data, condition.get('field', ''))
        operator = condition.get('operator')
        
        try:
            operator_enum = OperatorEnum(operator)
        except ValueError:
            logger.warning(f"Unknown operator: {operator}")
            return False
        
        operator_func = self.operators.get(operator_enum)
        if operator_func is None:
            return False
        
        try:
            return operator_func(field_value, condition.get('value'), condition.get('value2'))
        except Exception as e:
            logger.error(f"Error evaluating condition: {e}")
            return False
    
    def evaluate_condition_group(self, group: Dict, data: Dict[str, Any]) -> bool:
        conditions = group.get('conditions', [])
        if not conditions:
            return True
        
        results = []
        for item in conditions:
            if 'logical_operator' in item or 'conditions' in item:
                result = self.evaluate_condition_group(item, data)
            else:
                result = self.evaluate_condition(item, data)
            results.append(result)
        
        logical_op = group.get('logical_operator', 'AND')
        if logical_op == 'AND':
            final_result = all(results) if results else True
        else:
            final_result = any(results) if results else False
        
        return not final_result if group.get('is_negated', False) else final_result
    
    def is_rule_applicable(self, rule: Dict[str, Any], product_type: str, current_case_type: int) -> bool:
        if not rule.get('is_enabled', True):
            return False
        
        now = datetime.now(timezone.utc).isoformat()
        effective_from = rule.get('effective_from')
        effective_to = rule.get('effective_to')
        
        if effective_from and now < effective_from:
            return False
        if effective_to and now > effective_to:
            return False
        
        products = rule.get('products', [])
        if products and product_type not in products:
            return False
        
        case_types = rule.get('case_types', [])
        if case_types and current_case_type not in case_types:
            return False
        
        return True

rule_engine = RuleEngine()

# ==================== HELPER FUNCTIONS ====================
def log_audit(db: Session, action: str, entity_type: str, entity_id: str, entity_name: str, changes: Dict = {}):
    audit = AuditLogModel(
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        entity_name=entity_name,
        changes=changes
    )
    db.add(audit)
    db.commit()

def get_case_type_label(case_type: int) -> str:
    labels = {
        0: "Normal Case",
        1: "Direct Accept",
        -1: "Direct Fail",
        3: "GCRP Case"
    }
    return labels.get(case_type, "Unknown")

def model_to_dict(model) -> Dict:
    return {c.name: getattr(model, c.name) for c in model.__table__.columns}

# ==================== API ROUTES ====================

@api_router.get("/")
def root():
    return {"message": "Life Insurance STP & Underwriting Rule Engine API", "status": "healthy"}

@api_router.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# ==================== RULE CRUD ====================
@api_router.post("/rules", response_model=RuleResponse)
def create_rule(rule_data: RuleCreate, db: Session = Depends(get_db)):
    rule = RuleModel(
        name=rule_data.name,
        description=rule_data.description,
        category=rule_data.category.value,
        stage_id=rule_data.stage_id,
        condition_group=rule_data.condition_group.model_dump(),
        action=rule_data.action.model_dump(),
        priority=rule_data.priority,
        is_enabled=rule_data.is_enabled,
        effective_from=rule_data.effective_from,
        effective_to=rule_data.effective_to,
        products=[p.value for p in rule_data.products],
        case_types=[c.value for c in rule_data.case_types]
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    log_audit(db, "CREATE", "rule", rule.id, rule.name)
    return rule_to_response(db, rule)

@api_router.get("/rules", response_model=List[RuleResponse])
def get_rules(
    category: Optional[str] = None,
    product: Optional[str] = None,
    is_enabled: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(RuleModel)
    
    if category:
        query = query.filter(RuleModel.category == category)
    if is_enabled is not None:
        query = query.filter(RuleModel.is_enabled == is_enabled)
    if search:
        query = query.filter(
            (RuleModel.name.ilike(f"%{search}%")) | 
            (RuleModel.description.ilike(f"%{search}%"))
        )
    
    rules = query.order_by(RuleModel.priority).all()
    
    if product:
        rules = [r for r in rules if product in (r.products or [])]
    
    return [model_to_dict(r) for r in rules]

@api_router.get("/rules/{rule_id}", response_model=RuleResponse)
def get_rule(rule_id: str, db: Session = Depends(get_db)):
    rule = db.query(RuleModel).filter(RuleModel.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return model_to_dict(rule)

@api_router.put("/rules/{rule_id}", response_model=RuleResponse)
def update_rule(rule_id: str, rule_data: RuleUpdate, db: Session = Depends(get_db)):
    rule = db.query(RuleModel).filter(RuleModel.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    update_data = rule_data.model_dump(exclude_unset=True)
    
    if 'condition_group' in update_data and update_data['condition_group']:
        update_data['condition_group'] = update_data['condition_group'].model_dump() if hasattr(update_data['condition_group'], 'model_dump') else update_data['condition_group']
    if 'action' in update_data and update_data['action']:
        update_data['action'] = update_data['action'].model_dump() if hasattr(update_data['action'], 'model_dump') else update_data['action']
    if 'category' in update_data and update_data['category']:
        update_data['category'] = update_data['category'].value if hasattr(update_data['category'], 'value') else update_data['category']
    if 'products' in update_data and update_data['products']:
        update_data['products'] = [p.value if hasattr(p, 'value') else p for p in update_data['products']]
    if 'case_types' in update_data and update_data['case_types']:
        update_data['case_types'] = [c.value if hasattr(c, 'value') else c for c in update_data['case_types']]
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    update_data['version'] = rule.version + 1
    
    for key, value in update_data.items():
        if value is not None:
            setattr(rule, key, value)
    
    db.commit()
    db.refresh(rule)
    log_audit(db, "UPDATE", "rule", rule_id, rule.name, update_data)
    return model_to_dict(rule)

@api_router.delete("/rules/{rule_id}")
def delete_rule(rule_id: str, db: Session = Depends(get_db)):
    rule = db.query(RuleModel).filter(RuleModel.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    name = rule.name
    db.delete(rule)
    db.commit()
    log_audit(db, "DELETE", "rule", rule_id, name)
    return {"message": "Rule deleted successfully"}

@api_router.patch("/rules/{rule_id}/toggle")
def toggle_rule(rule_id: str, db: Session = Depends(get_db)):
    rule = db.query(RuleModel).filter(RuleModel.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    rule.is_enabled = not rule.is_enabled
    rule.updated_at = datetime.now(timezone.utc).isoformat()
    db.commit()
    log_audit(db, "TOGGLE", "rule", rule_id, rule.name, {"is_enabled": rule.is_enabled})
    return {"id": rule_id, "is_enabled": rule.is_enabled}

# ==================== SCORECARD CRUD ====================
@api_router.post("/scorecards")
def create_scorecard(scorecard_data: ScorecardCreate, db: Session = Depends(get_db)):
    scorecard = ScorecardModel(
        name=scorecard_data.name,
        description=scorecard_data.description,
        product=scorecard_data.product.value,
        parameters=[p.model_dump() for p in scorecard_data.parameters],
        threshold_direct_accept=scorecard_data.threshold_direct_accept,
        threshold_normal=scorecard_data.threshold_normal,
        threshold_refer=scorecard_data.threshold_refer,
        is_enabled=scorecard_data.is_enabled
    )
    db.add(scorecard)
    db.commit()
    db.refresh(scorecard)
    log_audit(db, "CREATE", "scorecard", scorecard.id, scorecard.name)
    return model_to_dict(scorecard)

@api_router.get("/scorecards")
def get_scorecards(product: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ScorecardModel)
    if product:
        query = query.filter(ScorecardModel.product == product)
    scorecards = query.all()
    return [model_to_dict(s) for s in scorecards]

@api_router.get("/scorecards/{scorecard_id}")
def get_scorecard(scorecard_id: str, db: Session = Depends(get_db)):
    scorecard = db.query(ScorecardModel).filter(ScorecardModel.id == scorecard_id).first()
    if not scorecard:
        raise HTTPException(status_code=404, detail="Scorecard not found")
    return model_to_dict(scorecard)

@api_router.put("/scorecards/{scorecard_id}")
def update_scorecard(scorecard_id: str, scorecard_data: ScorecardCreate, db: Session = Depends(get_db)):
    scorecard = db.query(ScorecardModel).filter(ScorecardModel.id == scorecard_id).first()
    if not scorecard:
        raise HTTPException(status_code=404, detail="Scorecard not found")
    
    scorecard.name = scorecard_data.name
    scorecard.description = scorecard_data.description
    scorecard.product = scorecard_data.product.value
    scorecard.parameters = [p.model_dump() for p in scorecard_data.parameters]
    scorecard.threshold_direct_accept = scorecard_data.threshold_direct_accept
    scorecard.threshold_normal = scorecard_data.threshold_normal
    scorecard.threshold_refer = scorecard_data.threshold_refer
    scorecard.is_enabled = scorecard_data.is_enabled
    scorecard.updated_at = datetime.now(timezone.utc).isoformat()
    
    db.commit()
    db.refresh(scorecard)
    log_audit(db, "UPDATE", "scorecard", scorecard_id, scorecard.name)
    return model_to_dict(scorecard)

@api_router.delete("/scorecards/{scorecard_id}")
def delete_scorecard(scorecard_id: str, db: Session = Depends(get_db)):
    scorecard = db.query(ScorecardModel).filter(ScorecardModel.id == scorecard_id).first()
    if not scorecard:
        raise HTTPException(status_code=404, detail="Scorecard not found")
    
    name = scorecard.name
    db.delete(scorecard)
    db.commit()
    log_audit(db, "DELETE", "scorecard", scorecard_id, name)
    return {"message": "Scorecard deleted successfully"}

# ==================== GRID CRUD ====================
@api_router.post("/grids")
def create_grid(grid_data: GridCreate, db: Session = Depends(get_db)):
    grid = GridModel(
        name=grid_data.name,
        description=grid_data.description,
        grid_type=grid_data.grid_type,
        row_field=grid_data.row_field,
        col_field=grid_data.col_field,
        row_labels=grid_data.row_labels,
        col_labels=grid_data.col_labels,
        cells=[c.model_dump() for c in grid_data.cells],
        products=[p.value for p in grid_data.products],
        is_enabled=grid_data.is_enabled
    )
    db.add(grid)
    db.commit()
    db.refresh(grid)
    log_audit(db, "CREATE", "grid", grid.id, grid.name)
    return model_to_dict(grid)

@api_router.get("/grids")
def get_grids(grid_type: Optional[str] = None, product: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(GridModel)
    if grid_type:
        query = query.filter(GridModel.grid_type == grid_type)
    grids = query.all()
    
    if product:
        grids = [g for g in grids if product in (g.products or [])]
    
    return [model_to_dict(g) for g in grids]

@api_router.get("/grids/{grid_id}")
def get_grid(grid_id: str, db: Session = Depends(get_db)):
    grid = db.query(GridModel).filter(GridModel.id == grid_id).first()
    if not grid:
        raise HTTPException(status_code=404, detail="Grid not found")
    return model_to_dict(grid)

@api_router.put("/grids/{grid_id}")
def update_grid(grid_id: str, grid_data: GridCreate, db: Session = Depends(get_db)):
    grid = db.query(GridModel).filter(GridModel.id == grid_id).first()
    if not grid:
        raise HTTPException(status_code=404, detail="Grid not found")
    
    grid.name = grid_data.name
    grid.description = grid_data.description
    grid.grid_type = grid_data.grid_type
    grid.row_field = grid_data.row_field
    grid.col_field = grid_data.col_field
    grid.row_labels = grid_data.row_labels
    grid.col_labels = grid_data.col_labels
    grid.cells = [c.model_dump() for c in grid_data.cells]
    grid.products = [p.value for p in grid_data.products]
    grid.is_enabled = grid_data.is_enabled
    grid.updated_at = datetime.now(timezone.utc).isoformat()
    
    db.commit()
    db.refresh(grid)
    log_audit(db, "UPDATE", "grid", grid_id, grid.name)
    return model_to_dict(grid)

@api_router.delete("/grids/{grid_id}")
def delete_grid(grid_id: str, db: Session = Depends(get_db)):
    grid = db.query(GridModel).filter(GridModel.id == grid_id).first()
    if not grid:
        raise HTTPException(status_code=404, detail="Grid not found")
    
    name = grid.name
    db.delete(grid)
    db.commit()
    log_audit(db, "DELETE", "grid", grid_id, name)
    return {"message": "Grid deleted successfully"}

# ==================== PRODUCT CRUD ====================
@api_router.post("/products")
def create_product(product_data: ProductCreate, db: Session = Depends(get_db)):
    product = ProductModel(
        code=product_data.code,
        name=product_data.name,
        product_type=product_data.product_type.value,
        description=product_data.description,
        min_age=product_data.min_age,
        max_age=product_data.max_age,
        min_sum_assured=product_data.min_sum_assured,
        max_sum_assured=product_data.max_sum_assured,
        min_premium=product_data.min_premium,
        is_enabled=product_data.is_enabled
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    log_audit(db, "CREATE", "product", product.id, product.name)
    return model_to_dict(product)

@api_router.get("/products")
def get_products(product_type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ProductModel)
    if product_type:
        query = query.filter(ProductModel.product_type == product_type)
    products = query.all()
    return [model_to_dict(p) for p in products]

@api_router.get("/products/{product_id}")
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return model_to_dict(product)

@api_router.put("/products/{product_id}")
def update_product(product_id: str, product_data: ProductCreate, db: Session = Depends(get_db)):
    product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product.code = product_data.code
    product.name = product_data.name
    product.product_type = product_data.product_type.value
    product.description = product_data.description
    product.min_age = product_data.min_age
    product.max_age = product_data.max_age
    product.min_sum_assured = product_data.min_sum_assured
    product.max_sum_assured = product_data.max_sum_assured
    product.min_premium = product_data.min_premium
    product.is_enabled = product_data.is_enabled
    
    db.commit()
    db.refresh(product)
    log_audit(db, "UPDATE", "product", product_id, product.name)
    return model_to_dict(product)

@api_router.delete("/products/{product_id}")
def delete_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    name = product.name
    db.delete(product)
    db.commit()
    log_audit(db, "DELETE", "product", product_id, name)
    return {"message": "Product deleted successfully"}

# ==================== UNDERWRITING EVALUATION ====================
@api_router.post("/underwriting/evaluate", response_model=EvaluationResult)
def evaluate_proposal(proposal: ProposalData, db: Session = Depends(get_db)):
    import time
    start_time = time.time()
    
    stp_decision = "PASS"
    case_type = CaseTypeEnum.NORMAL.value
    reason_flag = ReasonFlagEnum.STP_PASS_SKIP.value
    scorecard_value = 0
    triggered_rules = []
    validation_errors = []
    reason_codes = []
    reason_messages = []
    rule_trace = []
    
    proposal_dict = proposal.model_dump()
    
    # Get all enabled rules sorted by priority
    rules = db.query(RuleModel).filter(RuleModel.is_enabled == True).order_by(RuleModel.priority).all()
    
    # Phase 1: Validation Rules
    validation_rules = [r for r in rules if r.category == RuleCategoryEnum.VALIDATION.value]
    for rule in validation_rules:
        rule_start = time.time()
        rule_dict = model_to_dict(rule)
        
        if not rule_engine.is_rule_applicable(rule_dict, proposal.product_type.value, case_type):
            continue
        
        condition_group = rule.condition_group
        triggered = rule_engine.evaluate_condition_group(condition_group, proposal_dict)
        
        input_vals = {}
        for cond in condition_group.get('conditions', []):
            if isinstance(cond, dict) and 'field' in cond:
                input_vals[cond['field']] = rule_engine.get_field_value(proposal_dict, cond['field'])
        
        trace_entry = RuleExecutionTrace(
            rule_id=rule.id,
            rule_name=rule.name,
            category=rule.category,
            triggered=triggered,
            input_values=input_vals,
            condition_result=triggered,
            action_applied=rule.action if triggered else None,
            execution_time_ms=(time.time() - rule_start) * 1000
        )
        rule_trace.append(trace_entry)
        
        if triggered:
            action = rule.action or {}
            if action.get('reason_message'):
                validation_errors.append(action['reason_message'])
            if action.get('reason_code'):
                reason_codes.append(action['reason_code'])
            triggered_rules.append(rule.name)
            
            if action.get('is_hard_stop'):
                stp_decision = "FAIL"
                case_type = CaseTypeEnum.DIRECT_FAIL.value
                reason_flag = ReasonFlagEnum.STP_FAIL_PRINT.value
    
    # Phase 2: STP Decision Rules
    if stp_decision == "PASS":
        stp_rules = [r for r in rules if r.category == RuleCategoryEnum.STP_DECISION.value]
        for rule in stp_rules:
            rule_start = time.time()
            rule_dict = model_to_dict(rule)
            
            if not rule_engine.is_rule_applicable(rule_dict, proposal.product_type.value, case_type):
                continue
            
            condition_group = rule.condition_group
            triggered = rule_engine.evaluate_condition_group(condition_group, proposal_dict)
            
            input_vals = {}
            for cond in condition_group.get('conditions', []):
                if isinstance(cond, dict) and 'field' in cond:
                    input_vals[cond['field']] = rule_engine.get_field_value(proposal_dict, cond['field'])
            
            trace_entry = RuleExecutionTrace(
                rule_id=rule.id,
                rule_name=rule.name,
                category=rule.category,
                triggered=triggered,
                input_values=input_vals,
                condition_result=triggered,
                action_applied=rule.action if triggered else None,
                execution_time_ms=(time.time() - rule_start) * 1000
            )
            rule_trace.append(trace_entry)
            
            if triggered:
                action = rule.action or {}
                triggered_rules.append(rule.name)
                
                if action.get('decision') == "FAIL":
                    stp_decision = "FAIL"
                    reason_flag = ReasonFlagEnum.STP_FAIL_PRINT.value
                
                if action.get('reason_code'):
                    reason_codes.append(action['reason_code'])
                if action.get('reason_message'):
                    reason_messages.append(action['reason_message'])
                
                if action.get('is_hard_stop'):
                    case_type = CaseTypeEnum.DIRECT_FAIL.value
                    break
    
    # Phase 3: Scorecard Evaluation
    scorecards = db.query(ScorecardModel).filter(
        ScorecardModel.product == proposal.product_type.value,
        ScorecardModel.is_enabled == True
    ).all()
    
    for scorecard in scorecards:
        for param in scorecard.parameters or []:
            field_value = rule_engine.get_field_value(proposal_dict, param.get('field', ''))
            for band in param.get('bands', []):
                min_val = band.get('min', float('-inf'))
                max_val = band.get('max', float('inf'))
                try:
                    if min_val <= float(field_value) <= max_val:
                        scorecard_value += int(band.get('score', 0) * param.get('weight', 1))
                        break
                except (ValueError, TypeError):
                    pass
        
        if scorecard_value >= scorecard.threshold_direct_accept:
            if case_type == CaseTypeEnum.NORMAL.value:
                case_type = CaseTypeEnum.DIRECT_ACCEPT.value
        elif scorecard_value < scorecard.threshold_refer:
            case_type = CaseTypeEnum.GCRP.value
    
    # Phase 4: Case Type Rules
    case_type_rules = [r for r in rules if r.category == RuleCategoryEnum.CASE_TYPE.value]
    for rule in case_type_rules:
        rule_start = time.time()
        rule_dict = model_to_dict(rule)
        
        if not rule_engine.is_rule_applicable(rule_dict, proposal.product_type.value, case_type):
            continue
        
        condition_group = rule.condition_group
        triggered = rule_engine.evaluate_condition_group(condition_group, proposal_dict)
        
        input_vals = {}
        for cond in condition_group.get('conditions', []):
            if isinstance(cond, dict) and 'field' in cond:
                input_vals[cond['field']] = rule_engine.get_field_value(proposal_dict, cond['field'])
        
        trace_entry = RuleExecutionTrace(
            rule_id=rule.id,
            rule_name=rule.name,
            category=rule.category,
            triggered=triggered,
            input_values=input_vals,
            condition_result=triggered,
            action_applied=rule.action if triggered else None,
            execution_time_ms=(time.time() - rule_start) * 1000
        )
        rule_trace.append(trace_entry)
        
        if triggered:
            action = rule.action or {}
            triggered_rules.append(rule.name)
            
            if action.get('case_type') is not None:
                case_type = action['case_type']
            
            if action.get('reason_code'):
                reason_codes.append(action['reason_code'])
            if action.get('reason_message'):
                reason_messages.append(action['reason_message'])
    
    # Phase 5: Grid Evaluations
    grids = db.query(GridModel).filter(GridModel.is_enabled == True).all()
    
    for grid in grids:
        if grid.products and proposal.product_type.value not in grid.products:
            continue
        
        row_value = str(rule_engine.get_field_value(proposal_dict, grid.row_field or ''))
        col_value = str(rule_engine.get_field_value(proposal_dict, grid.col_field or ''))
        
        for cell in grid.cells or []:
            if cell.get('row_value') == row_value and cell.get('col_value') == col_value:
                if cell.get('result') == 'DECLINE':
                    stp_decision = "FAIL"
                    case_type = CaseTypeEnum.DIRECT_FAIL.value
                    reason_flag = ReasonFlagEnum.STP_FAIL_PRINT.value
                    reason_messages.append(f"Grid {grid.name}: {row_value} × {col_value} = DECLINE")
                elif cell.get('result') == 'REFER':
                    case_type = CaseTypeEnum.GCRP.value
                    reason_messages.append(f"Grid {grid.name}: {row_value} × {col_value} = REFER")
                
                if cell.get('score_impact'):
                    scorecard_value += cell['score_impact']
                break
    
    execution_time = (time.time() - start_time) * 1000
    
    result = EvaluationResult(
        proposal_id=proposal.proposal_id,
        stp_decision=stp_decision,
        case_type=CaseTypeEnum(case_type),
        case_type_label=get_case_type_label(case_type),
        reason_flag=ReasonFlagEnum(reason_flag),
        scorecard_value=scorecard_value,
        triggered_rules=triggered_rules,
        validation_errors=validation_errors,
        reason_codes=list(set(reason_codes)),
        reason_messages=list(set(reason_messages)),
        rule_trace=rule_trace,
        evaluation_time_ms=round(execution_time, 2),
        evaluated_at=datetime.now(timezone.utc).isoformat()
    )
    
    # Store evaluation
    eval_model = EvaluationModel(
        proposal_id=result.proposal_id,
        stp_decision=result.stp_decision,
        case_type=result.case_type.value,
        case_type_label=result.case_type_label,
        reason_flag=result.reason_flag.value,
        scorecard_value=result.scorecard_value,
        triggered_rules=result.triggered_rules,
        validation_errors=result.validation_errors,
        reason_codes=result.reason_codes,
        reason_messages=result.reason_messages,
        rule_trace=[t.model_dump() for t in result.rule_trace],
        evaluation_time_ms=result.evaluation_time_ms,
        evaluated_at=result.evaluated_at
    )
    db.add(eval_model)
    db.commit()
    
    return result

# ==================== AUDIT LOGS ====================
@api_router.get("/audit-logs")
def get_audit_logs(
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLogModel)
    if entity_type:
        query = query.filter(AuditLogModel.entity_type == entity_type)
    if action:
        query = query.filter(AuditLogModel.action == action)
    
    logs = query.order_by(AuditLogModel.performed_at.desc()).limit(limit).all()
    return [model_to_dict(log) for log in logs]

# ==================== EVALUATIONS HISTORY ====================
@api_router.get("/evaluations")
def get_evaluations(
    stp_decision: Optional[str] = None,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(EvaluationModel)
    if stp_decision:
        query = query.filter(EvaluationModel.stp_decision == stp_decision)
    
    evaluations = query.order_by(EvaluationModel.evaluated_at.desc()).limit(limit).all()
    return [model_to_dict(e) for e in evaluations]

@api_router.get("/evaluations/{evaluation_id}")
def get_evaluation(evaluation_id: str, db: Session = Depends(get_db)):
    evaluation = db.query(EvaluationModel).filter(EvaluationModel.id == evaluation_id).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return model_to_dict(evaluation)

# ==================== DASHBOARD STATS ====================
@api_router.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_rules = db.query(RuleModel).count()
    active_rules = db.query(RuleModel).filter(RuleModel.is_enabled == True).count()
    total_evaluations = db.query(EvaluationModel).count()
    stp_pass = db.query(EvaluationModel).filter(EvaluationModel.stp_decision == "PASS").count()
    stp_fail = db.query(EvaluationModel).filter(EvaluationModel.stp_decision == "FAIL").count()
    
    stp_rate = (stp_pass / total_evaluations * 100) if total_evaluations > 0 else 0
    
    # Category distribution
    from sqlalchemy import func
    category_dist = db.query(
        RuleModel.category,
        func.count(RuleModel.id).label('count')
    ).group_by(RuleModel.category).all()
    
    recent_evals = db.query(EvaluationModel).order_by(EvaluationModel.evaluated_at.desc()).limit(10).all()
    
    return {
        "total_rules": total_rules,
        "active_rules": active_rules,
        "inactive_rules": total_rules - active_rules,
        "total_evaluations": total_evaluations,
        "stp_pass": stp_pass,
        "stp_fail": stp_fail,
        "stp_rate": round(stp_rate, 2),
        "category_distribution": [{"category": cat, "count": cnt} for cat, cnt in category_dist],
        "recent_evaluations": [model_to_dict(e) for e in recent_evals]
    }

# ==================== SEED DATA ====================
@api_router.post("/seed")
def seed_sample_data(db: Session = Depends(get_db)):
    # Clear existing data
    db.query(RuleModel).delete()
    db.query(ScorecardModel).delete()
    db.query(GridModel).delete()
    db.query(ProductModel).delete()
    db.commit()
    
    # Sample Products
    products = [
        ProductModel(
            code="TERM001",
            name="Term Life Protect",
            product_type="term_life",
            description="Pure term life insurance with death benefit",
            min_age=18, max_age=65,
            min_sum_assured=500000, max_sum_assured=50000000,
            min_premium=5000, is_enabled=True
        ),
        ProductModel(
            code="ENDOW001",
            name="Endowment Savings Plan",
            product_type="endowment",
            description="Endowment plan with maturity benefit",
            min_age=18, max_age=55,
            min_sum_assured=100000, max_sum_assured=10000000,
            min_premium=10000, is_enabled=True
        ),
        ProductModel(
            code="ULIP001",
            name="ULIP Growth Fund",
            product_type="ulip",
            description="Unit linked insurance plan with market-linked returns",
            min_age=18, max_age=60,
            min_sum_assured=250000, max_sum_assured=25000000,
            min_premium=25000, is_enabled=True
        )
    ]
    for p in products:
        db.add(p)
    
    # Sample Rules
    validation_rules = [
        RuleModel(
            name="Missing Income Validation",
            description="Check if applicant income is provided",
            category="validation",
            condition_group={
                "logical_operator": "OR",
                "conditions": [
                    {"field": "applicant_income", "operator": "is_empty", "value": None},
                    {"field": "applicant_income", "operator": "less_than_or_equal", "value": 0}
                ],
                "is_negated": False
            },
            action={
                "decision": "FAIL",
                "reason_code": "VAL001",
                "reason_message": "Applicant income is missing or invalid",
                "is_hard_stop": True
            },
            priority=10, is_enabled=True,
            products=["term_life", "endowment", "ulip"]
        ),
        RuleModel(
            name="Missing Premium Validation",
            description="Check if premium is provided and valid",
            category="validation",
            condition_group={
                "logical_operator": "OR",
                "conditions": [
                    {"field": "premium", "operator": "is_empty", "value": None},
                    {"field": "premium", "operator": "less_than_or_equal", "value": 0}
                ],
                "is_negated": False
            },
            action={
                "decision": "FAIL",
                "reason_code": "VAL002",
                "reason_message": "Premium amount is missing or invalid",
                "is_hard_stop": True
            },
            priority=10, is_enabled=True,
            products=["term_life", "endowment", "ulip"]
        ),
        RuleModel(
            name="Age Eligibility Check",
            description="Validate applicant age is within acceptable range",
            category="validation",
            condition_group={
                "logical_operator": "OR",
                "conditions": [
                    {"field": "applicant_age", "operator": "less_than", "value": 18},
                    {"field": "applicant_age", "operator": "greater_than", "value": 70}
                ],
                "is_negated": False
            },
            action={
                "decision": "FAIL",
                "reason_code": "VAL003",
                "reason_message": "Applicant age must be between 18 and 70 years",
                "is_hard_stop": True
            },
            priority=10, is_enabled=True,
            products=["term_life", "endowment", "ulip"]
        )
    ]
    
    stp_rules = [
        RuleModel(
            name="High Sum Assured Check",
            description="Flag high sum assured for medical underwriting",
            category="stp_decision",
            condition_group={
                "logical_operator": "AND",
                "conditions": [
                    {"field": "sum_assured", "operator": "greater_than", "value": 10000000}
                ],
                "is_negated": False
            },
            action={
                "decision": "FAIL",
                "reason_code": "STP001",
                "reason_message": "Sum assured exceeds STP limit - Medical required",
                "is_hard_stop": False
            },
            priority=20, is_enabled=True,
            products=["term_life"]
        ),
        RuleModel(
            name="Smoker High Risk",
            description="Flag smokers with high sum assured",
            category="stp_decision",
            condition_group={
                "logical_operator": "AND",
                "conditions": [
                    {"field": "is_smoker", "operator": "equals", "value": True},
                    {"field": "sum_assured", "operator": "greater_than", "value": 5000000}
                ],
                "is_negated": False
            },
            action={
                "decision": "FAIL",
                "reason_code": "STP002",
                "reason_message": "Smoker with high coverage - Additional underwriting required",
                "is_hard_stop": False
            },
            priority=25, is_enabled=True,
            products=["term_life", "endowment"]
        ),
        RuleModel(
            name="Medical History Check",
            description="Flag applicants with medical history",
            category="stp_decision",
            condition_group={
                "logical_operator": "AND",
                "conditions": [
                    {"field": "has_medical_history", "operator": "equals", "value": True}
                ],
                "is_negated": False
            },
            action={
                "decision": "FAIL",
                "reason_code": "STP003",
                "reason_message": "Medical history present - Underwriter review required",
                "is_hard_stop": False
            },
            priority=30, is_enabled=True,
            products=["term_life", "endowment", "ulip"]
        )
    ]
    
    case_type_rules = [
        RuleModel(
            name="Low Risk Direct Accept",
            description="Direct accept for low risk profiles",
            category="case_type",
            condition_group={
                "logical_operator": "AND",
                "conditions": [
                    {"field": "applicant_age", "operator": "between", "value": 25, "value2": 45},
                    {"field": "is_smoker", "operator": "equals", "value": False},
                    {"field": "has_medical_history", "operator": "equals", "value": False},
                    {"field": "sum_assured", "operator": "less_than_or_equal", "value": 5000000}
                ],
                "is_negated": False
            },
            action={
                "case_type": 1,
                "reason_code": "CT001",
                "reason_message": "Low risk profile - Direct Accept"
            },
            priority=50, is_enabled=True,
            products=["term_life", "endowment"],
            case_types=[0]
        ),
        RuleModel(
            name="GCRP Referral",
            description="Refer to GCRP for specific conditions",
            category="case_type",
            condition_group={
                "logical_operator": "OR",
                "conditions": [
                    {"field": "occupation_risk", "operator": "equals", "value": "high"},
                    {"field": "applicant_age", "operator": "greater_than", "value": 55}
                ],
                "is_negated": False
            },
            action={
                "case_type": 3,
                "reason_code": "CT002",
                "reason_message": "Referred to GCRP for additional review"
            },
            priority=60, is_enabled=True,
            products=["term_life", "endowment", "ulip"],
            case_types=[0]
        )
    ]
    
    scorecard_rules = [
        RuleModel(
            name="Age Score - Young Adult Bonus",
            description="Bonus score for young adults",
            category="scorecard",
            condition_group={
                "logical_operator": "AND",
                "conditions": [
                    {"field": "applicant_age", "operator": "between", "value": 25, "value2": 35}
                ],
                "is_negated": False
            },
            action={
                "score_impact": 15,
                "reason_code": "SC001",
                "reason_message": "Age bonus: 25-35 years"
            },
            priority=100, is_enabled=True,
            products=["term_life", "endowment", "ulip"]
        ),
        RuleModel(
            name="Non-Smoker Bonus",
            description="Bonus score for non-smokers",
            category="scorecard",
            condition_group={
                "logical_operator": "AND",
                "conditions": [
                    {"field": "is_smoker", "operator": "equals", "value": False}
                ],
                "is_negated": False
            },
            action={
                "score_impact": 20,
                "reason_code": "SC002",
                "reason_message": "Non-smoker bonus"
            },
            priority=100, is_enabled=True,
            products=["term_life", "endowment"]
        )
    ]
    
    all_rules = validation_rules + stp_rules + case_type_rules + scorecard_rules
    for r in all_rules:
        db.add(r)
    
    # Sample Scorecards
    scorecard = ScorecardModel(
        name="Term Life Scorecard",
        description="Primary scorecard for term life products",
        product="term_life",
        parameters=[
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
            }
        ],
        threshold_direct_accept=80,
        threshold_normal=50,
        threshold_refer=30,
        is_enabled=True
    )
    db.add(scorecard)
    
    # Sample Grids
    grids = [
        GridModel(
            name="BMI Risk Grid",
            description="BMI-based risk assessment grid",
            grid_type="bmi",
            row_field="bmi",
            col_field="applicant_age",
            row_labels=["<18.5", "18.5-25", "25-30", "30-35", ">35"],
            col_labels=["18-30", "31-45", "46-55", "56-65", ">65"],
            cells=[
                {"row_value": "<18.5", "col_value": "18-30", "result": "ACCEPT", "score_impact": 0},
                {"row_value": "18.5-25", "col_value": "18-30", "result": "ACCEPT", "score_impact": 10},
                {"row_value": "25-30", "col_value": "18-30", "result": "ACCEPT", "score_impact": 5},
                {"row_value": "30-35", "col_value": "18-30", "result": "REFER", "score_impact": -5},
                {"row_value": ">35", "col_value": "18-30", "result": "DECLINE", "score_impact": -20}
            ],
            products=["term_life", "endowment", "ulip"],
            is_enabled=True
        ),
        GridModel(
            name="Income × Sum Assured Grid",
            description="Income to Sum Assured eligibility grid",
            grid_type="income_sa",
            row_field="applicant_income",
            col_field="sum_assured",
            row_labels=["<5L", "5L-10L", "10L-25L", "25L-50L", ">50L"],
            col_labels=["<25L", "25L-50L", "50L-1Cr", "1Cr-2Cr", ">2Cr"],
            cells=[
                {"row_value": "<5L", "col_value": "<25L", "result": "ACCEPT", "score_impact": 0},
                {"row_value": "<5L", "col_value": "25L-50L", "result": "REFER", "score_impact": -5},
                {"row_value": "<5L", "col_value": "50L-1Cr", "result": "DECLINE", "score_impact": -20},
                {"row_value": "5L-10L", "col_value": "<25L", "result": "ACCEPT", "score_impact": 5},
                {"row_value": "5L-10L", "col_value": "25L-50L", "result": "ACCEPT", "score_impact": 0}
            ],
            products=["term_life", "endowment", "ulip"],
            is_enabled=True
        )
    ]
    for g in grids:
        db.add(g)
    
    db.commit()
    
    return {
        "message": "Sample data seeded successfully",
        "products": len(products),
        "rules": len(all_rules),
        "scorecards": 1,
        "grids": len(grids)
    }

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
def startup_event():
    init_db()
    logger.info("Database tables created/verified")
