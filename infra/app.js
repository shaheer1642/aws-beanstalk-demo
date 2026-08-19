const path = require("path");
const cdk = require("aws-cdk-lib");
const elasticbeanstalk = require("aws-cdk-lib/aws-elasticbeanstalk");
const iam = require("aws-cdk-lib/aws-iam");
const s3assets = require("aws-cdk-lib/aws-s3-assets");

class BeanstalkStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const instanceRole = new iam.Role(this, "InstanceRole", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AWSElasticBeanstalkWebTier"),
      ],
    });
    const instanceProfile = new iam.CfnInstanceProfile(this, "InstanceProfile", {
      roles: [instanceRole.roleName],
    });

    const serviceRole = new iam.Role(this, "ServiceRole", {
      assumedBy: new iam.ServicePrincipal("elasticbeanstalk.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSElasticBeanstalkEnhancedHealth"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AWSElasticBeanstalkManagedUpdatesCustomerRolePolicy"),
      ],
    });

    const source = new s3assets.Asset(this, "Source", {
      path: path.join(__dirname, ".."),
      exclude: ["infra", "infra/**", "**/node_modules", "**/node_modules/**", ".git", ".git/**", "**/.env"],
    });
    source.grantRead(serviceRole);

    const app = new elasticbeanstalk.CfnApplication(this, "App", {
      applicationName: "aws-beanstalk-demo",
    });

    const version = new elasticbeanstalk.CfnApplicationVersion(this, "Version", {
      applicationName: app.ref,
      sourceBundle: { s3Bucket: source.s3BucketName, s3Key: source.s3ObjectKey },
    });
    version.addResourceDependency(app);

    const env = new elasticbeanstalk.CfnEnvironment(this, "Env", {
      environmentName: "aws-beanstalk-demo",
      applicationName: app.ref,
      solutionStackName: "64bit Amazon Linux 2023 v6.11.6 running Node.js 24",
      versionLabel: version.ref,
      optionSettings: [
        { namespace: "aws:autoscaling:launchconfiguration", optionName: "IamInstanceProfile", value: instanceProfile.ref },
        { namespace: "aws:elasticbeanstalk:environment", optionName: "EnvironmentType", value: "SingleInstance" },
        { namespace: "aws:elasticbeanstalk:environment", optionName: "ServiceRole", value: serviceRole.roleName },
        { namespace: "aws:ec2:instances", optionName: "InstanceTypes", value: "t3.micro" },
        { namespace: "aws:ec2:instances", optionName: "EnableSpot", value: "true" },
        { namespace: "aws:ec2:instances", optionName: "SpotFleetOnDemandBase", value: "0" },
        { namespace: "aws:ec2:instances", optionName: "SpotFleetOnDemandAboveBasePercentage", value: "0" },
      ],
    });
    env.addResourceDependency(version);

    new cdk.CfnOutput(this, "Url", { value: `http://${env.attrEndpointUrl}` });
  }
}

const app = new cdk.App();
new BeanstalkStack(app, "AwsBeanstalkDemo");
