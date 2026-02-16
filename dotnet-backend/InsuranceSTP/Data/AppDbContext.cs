using Microsoft.EntityFrameworkCore;
using InsuranceSTP.Models;

namespace InsuranceSTP.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    
    public DbSet<Rule> Rules { get; set; }
    public DbSet<RuleStage> RuleStages { get; set; }
    public DbSet<RiskBand> RiskBands { get; set; }
    public DbSet<Scorecard> Scorecards { get; set; }
    public DbSet<Grid> Grids { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<Evaluation> Evaluations { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // ==================== RULES TABLE ====================
        modelBuilder.Entity<Rule>().ToTable("rules");
        modelBuilder.Entity<Rule>().Property(r => r.Id).HasColumnName("id");
        modelBuilder.Entity<Rule>().Property(r => r.Name).HasColumnName("name");
        modelBuilder.Entity<Rule>().Property(r => r.Description).HasColumnName("description");
        modelBuilder.Entity<Rule>().Property(r => r.Category).HasColumnName("category");
        modelBuilder.Entity<Rule>().Property(r => r.StageId).HasColumnName("stage_id");
        modelBuilder.Entity<Rule>().Property(r => r.ConditionGroupJson).HasColumnName("condition_group");
        modelBuilder.Entity<Rule>().Property(r => r.ActionJson).HasColumnName("action");
        modelBuilder.Entity<Rule>().Property(r => r.Priority).HasColumnName("priority");
        modelBuilder.Entity<Rule>().Property(r => r.IsEnabled).HasColumnName("is_enabled");
        modelBuilder.Entity<Rule>().Property(r => r.EffectiveFrom).HasColumnName("effective_from");
        modelBuilder.Entity<Rule>().Property(r => r.EffectiveTo).HasColumnName("effective_to");
        modelBuilder.Entity<Rule>().Property(r => r.ProductsJson).HasColumnName("products");
        modelBuilder.Entity<Rule>().Property(r => r.CaseTypesJson).HasColumnName("case_types");
        modelBuilder.Entity<Rule>().Property(r => r.Version).HasColumnName("version");
        modelBuilder.Entity<Rule>().Property(r => r.CreatedAt).HasColumnName("created_at");
        modelBuilder.Entity<Rule>().Property(r => r.UpdatedAt).HasColumnName("updated_at");
        modelBuilder.Entity<Rule>().HasIndex(r => r.Category);
        modelBuilder.Entity<Rule>().HasIndex(r => r.Priority);
        modelBuilder.Entity<Rule>().HasIndex(r => r.StageId);
        
        // ==================== RULE_STAGES TABLE ====================
        modelBuilder.Entity<RuleStage>().ToTable("rule_stages");
        modelBuilder.Entity<RuleStage>().Property(s => s.Id).HasColumnName("id");
        modelBuilder.Entity<RuleStage>().Property(s => s.Name).HasColumnName("name");
        modelBuilder.Entity<RuleStage>().Property(s => s.Description).HasColumnName("description");
        modelBuilder.Entity<RuleStage>().Property(s => s.ExecutionOrder).HasColumnName("execution_order");
        modelBuilder.Entity<RuleStage>().Property(s => s.StopOnFail).HasColumnName("stop_on_fail");
        modelBuilder.Entity<RuleStage>().Property(s => s.Color).HasColumnName("color");
        modelBuilder.Entity<RuleStage>().Property(s => s.IsEnabled).HasColumnName("is_enabled");
        modelBuilder.Entity<RuleStage>().Property(s => s.CreatedAt).HasColumnName("created_at");
        modelBuilder.Entity<RuleStage>().Property(s => s.UpdatedAt).HasColumnName("updated_at");
        modelBuilder.Entity<RuleStage>().HasIndex(s => s.ExecutionOrder);
        
        // ==================== RISK_BANDS TABLE ====================
        modelBuilder.Entity<RiskBand>().ToTable("risk_bands");
        modelBuilder.Entity<RiskBand>().Property(r => r.Id).HasColumnName("id");
        modelBuilder.Entity<RiskBand>().Property(r => r.Name).HasColumnName("name");
        modelBuilder.Entity<RiskBand>().Property(r => r.Description).HasColumnName("description");
        modelBuilder.Entity<RiskBand>().Property(r => r.Category).HasColumnName("category");
        modelBuilder.Entity<RiskBand>().Property(r => r.ConditionJson).HasColumnName("condition");
        modelBuilder.Entity<RiskBand>().Property(r => r.LoadingPercentage).HasColumnName("loading_percentage");
        modelBuilder.Entity<RiskBand>().Property(r => r.RiskScore).HasColumnName("risk_score");
        modelBuilder.Entity<RiskBand>().Property(r => r.ProductsJson).HasColumnName("products");
        modelBuilder.Entity<RiskBand>().Property(r => r.Priority).HasColumnName("priority");
        modelBuilder.Entity<RiskBand>().Property(r => r.IsEnabled).HasColumnName("is_enabled");
        modelBuilder.Entity<RiskBand>().Property(r => r.CreatedAt).HasColumnName("created_at");
        modelBuilder.Entity<RiskBand>().Property(r => r.UpdatedAt).HasColumnName("updated_at");
        modelBuilder.Entity<RiskBand>().HasIndex(r => r.Category);
        modelBuilder.Entity<RiskBand>().HasIndex(r => r.Priority);
        
        // ==================== SCORECARDS TABLE ====================
        modelBuilder.Entity<Scorecard>().ToTable("scorecards");
        modelBuilder.Entity<Scorecard>().Property(s => s.Id).HasColumnName("id");
        modelBuilder.Entity<Scorecard>().Property(s => s.Name).HasColumnName("name");
        modelBuilder.Entity<Scorecard>().Property(s => s.Description).HasColumnName("description");
        modelBuilder.Entity<Scorecard>().Property(s => s.Product).HasColumnName("product");
        modelBuilder.Entity<Scorecard>().Property(s => s.ParametersJson).HasColumnName("parameters");
        modelBuilder.Entity<Scorecard>().Property(s => s.ThresholdDirectAccept).HasColumnName("threshold_direct_accept");
        modelBuilder.Entity<Scorecard>().Property(s => s.ThresholdNormal).HasColumnName("threshold_normal");
        modelBuilder.Entity<Scorecard>().Property(s => s.ThresholdRefer).HasColumnName("threshold_refer");
        modelBuilder.Entity<Scorecard>().Property(s => s.IsEnabled).HasColumnName("is_enabled");
        modelBuilder.Entity<Scorecard>().Property(s => s.CreatedAt).HasColumnName("created_at");
        modelBuilder.Entity<Scorecard>().Property(s => s.UpdatedAt).HasColumnName("updated_at");
        modelBuilder.Entity<Scorecard>().HasIndex(s => s.Product);
        
        // ==================== GRIDS TABLE ====================
        modelBuilder.Entity<Grid>().ToTable("grids");
        modelBuilder.Entity<Grid>().Property(g => g.Id).HasColumnName("id");
        modelBuilder.Entity<Grid>().Property(g => g.Name).HasColumnName("name");
        modelBuilder.Entity<Grid>().Property(g => g.Description).HasColumnName("description");
        modelBuilder.Entity<Grid>().Property(g => g.GridType).HasColumnName("grid_type");
        modelBuilder.Entity<Grid>().Property(g => g.RowField).HasColumnName("row_field");
        modelBuilder.Entity<Grid>().Property(g => g.ColField).HasColumnName("col_field");
        modelBuilder.Entity<Grid>().Property(g => g.RowLabelsJson).HasColumnName("row_labels");
        modelBuilder.Entity<Grid>().Property(g => g.ColLabelsJson).HasColumnName("col_labels");
        modelBuilder.Entity<Grid>().Property(g => g.CellsJson).HasColumnName("cells");
        modelBuilder.Entity<Grid>().Property(g => g.ProductsJson).HasColumnName("products");
        modelBuilder.Entity<Grid>().Property(g => g.IsEnabled).HasColumnName("is_enabled");
        modelBuilder.Entity<Grid>().Property(g => g.CreatedAt).HasColumnName("created_at");
        modelBuilder.Entity<Grid>().Property(g => g.UpdatedAt).HasColumnName("updated_at");
        modelBuilder.Entity<Grid>().HasIndex(g => g.GridType);
        
        // ==================== PRODUCTS TABLE ====================
        modelBuilder.Entity<Product>().ToTable("products");
        modelBuilder.Entity<Product>().Property(p => p.Id).HasColumnName("id");
        modelBuilder.Entity<Product>().Property(p => p.Code).HasColumnName("code");
        modelBuilder.Entity<Product>().Property(p => p.Name).HasColumnName("name");
        modelBuilder.Entity<Product>().Property(p => p.ProductType).HasColumnName("product_type");
        modelBuilder.Entity<Product>().Property(p => p.Description).HasColumnName("description");
        modelBuilder.Entity<Product>().Property(p => p.ParentProductId).HasColumnName("parent_product_id");
        modelBuilder.Entity<Product>().Property(p => p.MinAge).HasColumnName("min_age");
        modelBuilder.Entity<Product>().Property(p => p.MaxAge).HasColumnName("max_age");
        modelBuilder.Entity<Product>().Property(p => p.MinSumAssured).HasColumnName("min_sum_assured");
        modelBuilder.Entity<Product>().Property(p => p.MaxSumAssured).HasColumnName("max_sum_assured");
        modelBuilder.Entity<Product>().Property(p => p.MinPremium).HasColumnName("min_premium");
        modelBuilder.Entity<Product>().Property(p => p.HasMaturityBenefit).HasColumnName("has_maturity_benefit");
        modelBuilder.Entity<Product>().Property(p => p.IsEnabled).HasColumnName("is_enabled");
        modelBuilder.Entity<Product>().Property(p => p.CreatedAt).HasColumnName("created_at");
        modelBuilder.Entity<Product>().HasIndex(p => p.Code).IsUnique();
        
        // ==================== EVALUATIONS TABLE ====================
        modelBuilder.Entity<Evaluation>().ToTable("evaluations");
        modelBuilder.Entity<Evaluation>().Property(e => e.Id).HasColumnName("id");
        modelBuilder.Entity<Evaluation>().Property(e => e.ProposalId).HasColumnName("proposal_id");
        modelBuilder.Entity<Evaluation>().Property(e => e.StpDecision).HasColumnName("stp_decision");
        modelBuilder.Entity<Evaluation>().Property(e => e.CaseTypeValue).HasColumnName("case_type");
        modelBuilder.Entity<Evaluation>().Property(e => e.CaseTypeLabel).HasColumnName("case_type_label");
        modelBuilder.Entity<Evaluation>().Property(e => e.ReasonFlag).HasColumnName("reason_flag");
        modelBuilder.Entity<Evaluation>().Property(e => e.ScorecardValue).HasColumnName("scorecard_value");
        modelBuilder.Entity<Evaluation>().Property(e => e.TriggeredRulesJson).HasColumnName("triggered_rules");
        modelBuilder.Entity<Evaluation>().Property(e => e.ValidationErrorsJson).HasColumnName("validation_errors");
        modelBuilder.Entity<Evaluation>().Property(e => e.ReasonCodesJson).HasColumnName("reason_codes");
        modelBuilder.Entity<Evaluation>().Property(e => e.ReasonMessagesJson).HasColumnName("reason_messages");
        modelBuilder.Entity<Evaluation>().Property(e => e.RuleTraceJson).HasColumnName("rule_trace");
        modelBuilder.Entity<Evaluation>().Property(e => e.EvaluationTimeMs).HasColumnName("evaluation_time_ms");
        modelBuilder.Entity<Evaluation>().Property(e => e.EvaluatedAt).HasColumnName("evaluated_at");
        modelBuilder.Entity<Evaluation>().HasIndex(e => e.StpDecision);
        
        // ==================== AUDIT_LOGS TABLE ====================
        modelBuilder.Entity<AuditLog>().ToTable("audit_logs");
        modelBuilder.Entity<AuditLog>().Property(a => a.Id).HasColumnName("id");
        modelBuilder.Entity<AuditLog>().Property(a => a.Action).HasColumnName("action");
        modelBuilder.Entity<AuditLog>().Property(a => a.EntityType).HasColumnName("entity_type");
        modelBuilder.Entity<AuditLog>().Property(a => a.EntityId).HasColumnName("entity_id");
        modelBuilder.Entity<AuditLog>().Property(a => a.EntityName).HasColumnName("entity_name");
        modelBuilder.Entity<AuditLog>().Property(a => a.ChangesJson).HasColumnName("changes");
        modelBuilder.Entity<AuditLog>().Property(a => a.PerformedBy).HasColumnName("performed_by");
        modelBuilder.Entity<AuditLog>().Property(a => a.PerformedAt).HasColumnName("performed_at");
        modelBuilder.Entity<AuditLog>().HasIndex(a => a.EntityType);
    }
}
