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
    public DbSet<User> Users { get; set; }
    public DbSet<RuleTemplate> RuleTemplates { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // ==================== USERS TABLE (snake_case for new tables) ====================
        modelBuilder.Entity<User>().ToTable("users");
        modelBuilder.Entity<User>().Property(u => u.Id).HasColumnName("id");
        modelBuilder.Entity<User>().Property(u => u.Username).HasColumnName("username");
        modelBuilder.Entity<User>().Property(u => u.Email).HasColumnName("email");
        modelBuilder.Entity<User>().Property(u => u.PasswordHash).HasColumnName("password_hash");
        modelBuilder.Entity<User>().Property(u => u.FullName).HasColumnName("full_name");
        modelBuilder.Entity<User>().Property(u => u.Role).HasColumnName("role");
        modelBuilder.Entity<User>().Property(u => u.IsActive).HasColumnName("is_active");
        modelBuilder.Entity<User>().Property(u => u.CreatedAt).HasColumnName("created_at");
        modelBuilder.Entity<User>().Property(u => u.UpdatedAt).HasColumnName("updated_at");
        modelBuilder.Entity<User>().Property(u => u.LastLogin).HasColumnName("last_login");
        modelBuilder.Entity<User>().HasIndex(u => u.Username).IsUnique();
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
        
        // ==================== RULE_TEMPLATES TABLE (snake_case for new tables) ====================
        modelBuilder.Entity<RuleTemplate>().ToTable("rule_templates");
        modelBuilder.Entity<RuleTemplate>().Property(t => t.Id).HasColumnName("id");
        modelBuilder.Entity<RuleTemplate>().Property(t => t.TemplateId).HasColumnName("template_id");
        modelBuilder.Entity<RuleTemplate>().Property(t => t.Name).HasColumnName("name");
        modelBuilder.Entity<RuleTemplate>().Property(t => t.Description).HasColumnName("description");
        modelBuilder.Entity<RuleTemplate>().Property(t => t.Category).HasColumnName("category");
        modelBuilder.Entity<RuleTemplate>().Property(t => t.ConditionGroupJson).HasColumnName("condition_group");
        modelBuilder.Entity<RuleTemplate>().Property(t => t.ActionJson).HasColumnName("action");
        modelBuilder.Entity<RuleTemplate>().Property(t => t.LetterFlag).HasColumnName("letter_flag");
        modelBuilder.Entity<RuleTemplate>().Property(t => t.FollowUpCode).HasColumnName("follow_up_code");
        modelBuilder.Entity<RuleTemplate>().Property(t => t.Priority).HasColumnName("priority");
        modelBuilder.Entity<RuleTemplate>().Property(t => t.ProductsJson).HasColumnName("products");
        modelBuilder.Entity<RuleTemplate>().Property(t => t.IsActive).HasColumnName("is_active");
        modelBuilder.Entity<RuleTemplate>().Property(t => t.CreatedAt).HasColumnName("created_at");
        modelBuilder.Entity<RuleTemplate>().HasIndex(t => t.TemplateId).IsUnique();
        
        // ==================== EXISTING TABLES (PascalCase to match existing DB) ====================
        
        // Rules - PascalCase
        modelBuilder.Entity<Rule>().ToTable("Rules");
        modelBuilder.Entity<Rule>().HasIndex(r => r.Category);
        modelBuilder.Entity<Rule>().HasIndex(r => r.Priority);
        
        // RuleStages - PascalCase  
        modelBuilder.Entity<RuleStage>().ToTable("RuleStages");
        modelBuilder.Entity<RuleStage>().HasIndex(s => s.ExecutionOrder);
        
        // RiskBands - PascalCase
        modelBuilder.Entity<RiskBand>().ToTable("RiskBands");
        
        // Scorecards - PascalCase
        modelBuilder.Entity<Scorecard>().ToTable("Scorecards");
        modelBuilder.Entity<Scorecard>().HasIndex(s => s.Product);
        
        // Grids - PascalCase
        modelBuilder.Entity<Grid>().ToTable("Grids");
        modelBuilder.Entity<Grid>().HasIndex(g => g.GridType);
        
        // Products - PascalCase
        modelBuilder.Entity<Product>().ToTable("Products");
        modelBuilder.Entity<Product>().HasIndex(p => p.Code).IsUnique();
        
        // Evaluations - PascalCase
        modelBuilder.Entity<Evaluation>().ToTable("Evaluations");
        modelBuilder.Entity<Evaluation>().HasIndex(e => e.StpDecision);
        
        // AuditLogs - PascalCase
        modelBuilder.Entity<AuditLog>().ToTable("AuditLogs");
        modelBuilder.Entity<AuditLog>().HasIndex(a => a.EntityType);
    }
}
