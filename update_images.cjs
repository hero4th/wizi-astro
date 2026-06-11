const fs = require('fs');
const path = require('path');
const dir = './src/content/blog';
const files = fs.readdirSync(dir);

const categoryMap = {
  'sat': '/images/blog-sat.png',
  'paa': '/images/blog-sat.png',
  'universidades': '/images/blog-sat.png',
  'admisiones': '/images/blog-sat.png',
  'toefl': '/images/blog-toefl.png',
  'recursos-gratuitos': '/images/blog-toefl.png',
  'simuladores': '/images/blog-toefl.png',
  'gre': '/images/blog-gre.png',
  'gmat': '/images/blog-gre.png',
  'consejos-de-estudio': '/images/blog-gre.png'
};

for (const file of files) {
  if (file.endsWith('.mdx')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('title:') && content.includes('categorySlug:') && !content.includes('image:')) {
      const slugMatch = content.match(/categorySlug:\s*"([^"]+)"/);
      if (slugMatch) {
        const slug = slugMatch[1];
        const imageUrl = categoryMap[slug] || '/images/blog-sat.png';
        content = content.replace(/^---\s*$/m, `image: "${imageUrl}"\n---`);
        fs.writeFileSync(filePath, content);
        console.log('Updated ' + file + ' with ' + imageUrl);
      }
    }
  }
}
