using System.Text.Json;
using InsuranceSTP.Models;

namespace InsuranceSTP.Services;

public class RuleEngine
{
    private readonly Dictionary<string, Func<object?, object?, object?, bool>> _operators;
    
    public RuleEngine()
    {
        _operators = new Dictionary<string, Func<object?, object?, object?, bool>>
        {
            ["equals"] = (a, b, _) => CompareValues(a, b) == 0,
            ["not_equals"] = (a, b, _) => CompareValues(a, b) != 0,
            ["greater_than"] = (a, b, _) => CompareValues(a, b) > 0,
            ["less_than"] = (a, b, _) => CompareValues(a, b) < 0,
            ["greater_than_or_equal"] = (a, b, _) => CompareValues(a, b) >= 0,
            ["less_than_or_equal"] = (a, b, _) => CompareValues(a, b) <= 0,
            ["between"] = (a, b, c) => CompareValues(a, b) >= 0 && CompareValues(a, c) <= 0,
            ["in"] = (a, b, _) => IsInList(a, b),
            ["not_in"] = (a, b, _) => !IsInList(a, b),
            ["contains"] = (a, b, _) => a?.ToString()?.ToLower().Contains(b?.ToString()?.ToLower() ?? "") ?? false,
            ["starts_with"] = (a, b, _) => a?.ToString()?.ToLower().StartsWith(b?.ToString()?.ToLower() ?? "") ?? false,
            ["is_empty"] = (a, _, __) => a == null || string.IsNullOrEmpty(a.ToString()),
            ["is_not_empty"] = (a, _, __) => a != null && !string.IsNullOrEmpty(a.ToString())
        };
    }
    
    private static int CompareValues(object? a, object? b)
    {
        if (a == null && b == null) return 0;
        if (a == null) return -1;
        if (b == null) return 1;
        
        if (double.TryParse(a.ToString(), out var da) && double.TryParse(b.ToString(), out var db))
        {
            return da.CompareTo(db);
        }
        
        return string.Compare(a.ToString(), b.ToString(), StringComparison.OrdinalIgnoreCase);
    }
    
    private static bool IsInList(object? value, object? list)
    {
        if (value == null || list == null) return false;
        
        if (list is JsonElement jsonElement && jsonElement.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in jsonElement.EnumerateArray())
            {
                if (item.ToString() == value.ToString()) return true;
            }
        }
        
        if (list is IEnumerable<object> enumerable)
        {
            return enumerable.Any(item => item?.ToString() == value.ToString());
        }
        
        return value.ToString() == list.ToString();
    }
    
    public object? GetFieldValue(Dictionary<string, object?> data, string field)
    {
        var keys = field.Split('.');
        object? value = data;
        
        foreach (var key in keys)
        {
            if (value is Dictionary<string, object?> dict)
            {
                dict.TryGetValue(key, out value);
            }
            else if (value is JsonElement jsonElement && jsonElement.ValueKind == JsonValueKind.Object)
            {
                if (jsonElement.TryGetProperty(key, out var prop))
                {
                    value = GetJsonElementValue(prop);
                }
                else
                {
                    return null;
                }
            }
            else
            {
                return null;
            }
        }
        
        return value;
    }
    
    private static object? GetJsonElementValue(JsonElement element)
    {
        return element.ValueKind switch
        {
            JsonValueKind.String => element.GetString(),
            JsonValueKind.Number => element.GetDouble(),
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.Null => null,
            _ => element
        };
    }
    
    public bool EvaluateCondition(JsonElement condition, Dictionary<string, object?> data)
    {
        var field = condition.GetProperty("field").GetString() ?? "";
        var op = condition.GetProperty("operator").GetString() ?? "equals";
        
        var fieldValue = GetFieldValue(data, field);
        object? value = null;
        object? value2 = null;
        
        if (condition.TryGetProperty("value", out var valueProp))
        {
            value = GetJsonElementValue(valueProp);
        }
        
        if (condition.TryGetProperty("value2", out var value2Prop))
        {
            value2 = GetJsonElementValue(value2Prop);
        }
        
        if (_operators.TryGetValue(op, out var operatorFunc))
        {
            try
            {
                return operatorFunc(fieldValue, value, value2);
            }
            catch
            {
                return false;
            }
        }
        
        return false;
    }
    
    public bool EvaluateConditionGroup(JsonElement group, Dictionary<string, object?> data)
    {
        var logicalOp = "AND";
        if (group.TryGetProperty("logical_operator", out var logicalOpProp))
        {
            logicalOp = logicalOpProp.GetString() ?? "AND";
        }
        else if (group.TryGetProperty("logicalOperator", out var logicalOpProp2))
        {
            logicalOp = logicalOpProp2.GetString() ?? "AND";
        }
        
        var isNegated = false;
        if (group.TryGetProperty("is_negated", out var negatedProp))
        {
            isNegated = negatedProp.GetBoolean();
        }
        else if (group.TryGetProperty("isNegated", out var negatedProp2))
        {
            isNegated = negatedProp2.GetBoolean();
        }
        
        if (!group.TryGetProperty("conditions", out var conditions) || conditions.ValueKind != JsonValueKind.Array)
        {
            return true;
        }
        
        var results = new List<bool>();
        
        foreach (var item in conditions.EnumerateArray())
        {
            bool result;
            if (item.TryGetProperty("conditions", out _) || item.TryGetProperty("logical_operator", out _) || item.TryGetProperty("logicalOperator", out _))
            {
                result = EvaluateConditionGroup(item, data);
            }
            else
            {
                result = EvaluateCondition(item, data);
            }
            results.Add(result);
        }
        
        var finalResult = logicalOp.ToUpper() == "AND" 
            ? results.All(r => r) 
            : results.Any(r => r);
        
        return isNegated ? !finalResult : finalResult;
    }
    
    public bool IsRuleApplicable(Rule rule, string productType, int currentCaseType)
    {
        if (!rule.IsEnabled) return false;
        
        var now = DateTime.UtcNow.ToString("o");
        if (!string.IsNullOrEmpty(rule.EffectiveFrom) && string.Compare(now, rule.EffectiveFrom) < 0)
            return false;
        if (!string.IsNullOrEmpty(rule.EffectiveTo) && string.Compare(now, rule.EffectiveTo) > 0)
            return false;
        
        var products = rule.Products;
        if (products.Any() && !products.Contains(productType))
            return false;
        
        var caseTypes = rule.CaseTypes;
        if (caseTypes.Any() && !caseTypes.Contains(currentCaseType))
            return false;
        
        return true;
    }
}
