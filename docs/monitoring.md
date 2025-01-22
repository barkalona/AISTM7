# AISTM7 Monitoring Guide

## Overview

This guide details the monitoring and maintenance procedures for the AISTM7 platform. The system requires comprehensive monitoring across multiple components to ensure reliable operation and optimal performance.

## Key Metrics

### System Health

1. **API Performance**
   - Response times (95th percentile)
   - Request success rate
   - Error rates by endpoint
   - Active connections
   - WebSocket connection stability

2. **Database Performance**
   - Query execution times
   - Connection pool utilization
   - Active transactions
   - Deadlock incidents
   - Index usage statistics

3. **Resource Utilization**
   - CPU usage
   - Memory consumption
   - Disk I/O
   - Network bandwidth
   - Container health

### Business Metrics

1. **Portfolio Analysis**
   - Calculation latency
   - Update frequency
   - Data accuracy
   - API call volume
   - Cache hit rates

2. **Risk Analysis**
   - Model execution time
   - Prediction accuracy
   - Resource consumption
   - Error rates
   - Batch processing times

3. **Token System**
   - Token price updates
   - Requirement adjustments
   - Grace period utilization
   - Balance verification times
   - Access grant/deny rates

## Monitoring Tools

### Infrastructure Monitoring

1. **AWS CloudWatch**
   ```bash
   # Set up CloudWatch agent
   aws cloudwatch put-metric-alarm \
     --alarm-name high-cpu \
     --comparison-operator GreaterThanThreshold \
     --evaluation-periods 2 \
     --metric-name CPUUtilization \
     --namespace AWS/EC2 \
     --period 300 \
     --threshold 80
   ```

2. **Prometheus & Grafana**
   ```yaml
   # prometheus.yml
   scrape_configs:
     - job_name: 'aistm7'
       static_configs:
         - targets: ['localhost:9090']
       metrics_path: '/metrics'
       scheme: 'http'
   ```

### Application Monitoring

1. **API Health Checks**
   ```typescript
   // health-check.ts
   export const healthCheck = async () => {
     const checks = {
       database: await checkDatabase(),
       cache: await checkRedis(),
       ibkr: await checkIBKR(),
       solana: await checkSolanaRPC()
     };
     
     return {
       status: Object.values(checks).every(c => c.status === 'healthy') 
         ? 'healthy' 
         : 'degraded',
       checks
     };
   };
   ```

2. **Performance Monitoring**
   ```typescript
   // metrics.ts
   export const trackMetrics = {
     responseTime: (route: string, time: number) => {
       metrics.histogram('api.response_time', time, { route });
     },
     errorRate: (route: string, statusCode: number) => {
       metrics.increment('api.errors', { route, statusCode });
     }
   };
   ```

## Alert Configuration

### Critical Alerts

1. **System Availability**
   - API endpoint downtime > 1 minute
   - Database connection failures
   - IBKR connection loss
   - Solana RPC issues

2. **Performance Degradation**
   - Response time > 500ms (95th percentile)
   - Error rate > 1%
   - CPU usage > 80%
   - Memory usage > 85%

3. **Business Logic**
   - Risk calculation failures
   - Portfolio sync issues
   - Token requirement update failures
   - Grace period expiration warnings

### Alert Channels

1. **PagerDuty Integration**
   ```typescript
   const notifyPagerDuty = async (incident: Incident) => {
     await pagerduty.incidents.create({
       incident: {
         type: 'incident',
         title: incident.title,
         service: {
           id: 'PXXXXXX',
           type: 'service_reference'
         },
         urgency: incident.critical ? 'high' : 'low',
         body: { type: 'incident_body', details: incident.details }
       }
     });
   };
   ```

2. **Slack Notifications**
   ```typescript
   const notifySlack = async (alert: Alert) => {
     await slack.chat.postMessage({
       channel: alert.critical ? '#incidents' : '#monitoring',
       text: formatAlertMessage(alert),
       attachments: generateAlertAttachments(alert)
     });
   };
   ```

## Logging

### Log Levels

1. **ERROR**: System failures requiring immediate attention
2. **WARN**: Potential issues or degraded performance
3. **INFO**: Normal system operations
4. **DEBUG**: Detailed information for troubleshooting

### Log Format
```json
{
  "timestamp": "2025-01-22T10:30:00.000Z",
  "level": "ERROR",
  "service": "risk-analysis",
  "traceId": "abc123",
  "message": "Failed to calculate VaR",
  "details": {
    "error": "Insufficient data",
    "portfolio": "user123",
    "attempt": 2
  }
}
```

### Log Storage

1. **Short-term**: CloudWatch Logs
2. **Long-term**: S3 with lifecycle policies
3. **Analysis**: Elasticsearch for search and analytics

## Maintenance Procedures

### Daily Checks

1. **System Health**
   ```bash
   # Check system status
   curl https://api.aistm7.com/health
   
   # Verify all services
   docker-compose ps
   
   # Check logs for errors
   grep -i error /var/log/aistm7/*.log
   ```

2. **Performance Review**
   - Review CloudWatch dashboards
   - Check error rates
   - Verify data synchronization
   - Monitor queue depths

### Weekly Tasks

1. **Database Maintenance**
   ```sql
   -- Update statistics
   ANALYZE VERBOSE;
   
   -- Check index health
   SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
   FROM pg_stat_user_indexes;
   ```

2. **Backup Verification**
   ```bash
   # Verify backup integrity
   aws s3 ls s3://aistm7-backups/
   
   # Test restore procedure
   ./scripts/test-restore.sh
   ```

### Monthly Tasks

1. **Security Updates**
   - Review and apply system patches
   - Update dependencies
   - Rotate access keys
   - Review security logs

2. **Performance Optimization**
   - Analyze slow queries
   - Review resource utilization
   - Optimize caching strategies
   - Update scaling policies

## Troubleshooting

### Common Issues

1. **High API Latency**
   - Check database performance
   - Review active connections
   - Monitor cache hit rates
   - Check network latency

2. **Risk Calculation Failures**
   - Verify data availability
   - Check model dependencies
   - Monitor resource usage
   - Review error logs

3. **Token System Issues**
   - Check Solana RPC status
   - Verify price feed
   - Monitor balance updates
   - Review grace periods

### Recovery Procedures

1. **Service Recovery**
   ```bash
   # Restart service
   docker-compose restart service-name
   
   # Verify recovery
   ./scripts/health-check.sh
   
   # Monitor logs
   tail -f logs/service-name.log
   ```

2. **Data Recovery**
   ```bash
   # Restore from backup
   ./scripts/restore-backup.sh --date 2025-01-22
   
   # Verify data integrity
   ./scripts/verify-data.sh
   
   # Sync missing data
   ./scripts/sync-data.sh
   ```

## Reporting

### Daily Reports
- System health summary
- Performance metrics
- Error rates
- Business metrics

### Weekly Reports
- Trend analysis
- Resource utilization
- Cost optimization
- Security incidents

### Monthly Reports
- System reliability
- Performance trends
- Capacity planning
- Security assessment

## Contacts

### On-Call Rotation
1. Primary: DevOps Team
2. Secondary: Backend Team
3. Escalation: System Architects

### External Services
- IBKR Support: +1-xxx-xxx-xxxx
- AWS Support: Enterprise Support Portal
- Solana RPC: Status Page