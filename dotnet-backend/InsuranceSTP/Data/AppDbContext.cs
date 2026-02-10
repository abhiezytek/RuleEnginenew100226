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
        
        modelBuilder.Entity<Rule>()
            .HasIndex(r => r.Category);
        
        modelBuilder.Entity<Rule>()
            .HasIndex(r => r.Priority);
        
        modelBuilder.Entity<Rule>()
            .HasIndex(r => r.StageId);
        
        modelBuilder.Entity<RuleStage>()
            .HasIndex(s => s.ExecutionOrder);
        
        modelBuilder.Entity<RiskBand>()
            .HasIndex(r => r.Category);
        
        modelBuilder.Entity<RiskBand>()
            .HasIndex(r => r.Priority);
        
        modelBuilder.Entity<Scorecard>()
            .HasIndex(s => s.Product);
        
        modelBuilder.Entity<Grid>()
            .HasIndex(g => g.GridType);
        
        modelBuilder.Entity<Product>()
            .HasIndex(p => p.Code)
            .IsUnique();
        
        modelBuilder.Entity<Evaluation>()
            .HasIndex(e => e.StpDecision);
        
        modelBuilder.Entity<AuditLog>()
            .HasIndex(a => a.EntityType);
    }
}
