const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, 'services');
const services = fs.readdirSync(servicesDir).filter(f => fs.statSync(path.join(servicesDir, f)).isDirectory() && f !== 'shared-libraries' && f !== 'infrastructure');

const dependency = `
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
`;

for (const service of services) {
    const pomPath = path.join(servicesDir, service, 'pom.xml');
    if (fs.existsSync(pomPath)) {
        let content = fs.readFileSync(pomPath, 'utf8');
        if (!content.includes('spring-boot-starter-actuator')) {
            content = content.replace('<dependencies>', '<dependencies>' + dependency);
            fs.writeFileSync(pomPath, content);
            console.log(`Added actuator to ${service}`);
        }
    }
}
