// Simple test script for the validation system
const { ContentExtractionValidator } = require('./lib/content-extraction-validator.ts');

async function testValidation() {
  console.log('Testing Content Validation System...\n');
  
  const validator = new ContentExtractionValidator();
  
  // Test 1: Valid content
  console.log('Test 1: Valid Educational Content');
  const validContent = {
    text: `
      # Understanding Machine Learning
      
      Machine learning is a subset of artificial intelligence that enables computers to learn
      and make decisions from data without being explicitly programmed for every scenario.
      This revolutionary technology has transformed numerous industries and continues to evolve rapidly.
      
      ## Core Concepts
      
      At its foundation, machine learning relies on algorithms that can identify patterns
      in large datasets. These patterns allow systems to make predictions or decisions
      about new, unseen data. The process typically involves training a model on historical
      data and then testing its performance on new examples.
      
      There are three main types of machine learning:
      - Supervised learning uses labeled data to train models
      - Unsupervised learning finds patterns in unlabeled data
      - Reinforcement learning learns through trial and error
    `,
    metadata: {
      language: 'en',
      languageConfidence: 0.95,
      contentType: 'article'
    }
  };
  
  try {
    const result1 = await validator.validateExtractedContent(validContent);
    console.log('Result:', result1.success ? 'PASS' : 'FAIL');
    console.log('Score:', result1.validation?.score);
    console.log('Issues:', result1.validation?.issues?.length || 0);
    console.log('');
  } catch (error) {
    console.log('Error:', error.message);
  }
  
  // Test 2: Short content
  console.log('Test 2: Insufficient Content');
  const shortContent = {
    text: 'This is too short.',
    metadata: {
      language: 'en',
      languageConfidence: 0.9
    }
  };
  
  try {
    const result2 = await validator.validateExtractedContent(shortContent);
    console.log('Result:', result2.success ? 'PASS' : 'FAIL (Expected)');
    console.log('Error Type:', result2.error?.type);
    console.log('Recovery Options:', result2.error?.recoveryOptions?.length || 0);
    console.log('');
  } catch (error) {
    console.log('Error:', error.message);
  }
  
  console.log('Validation system test completed!');
}

testValidation().catch(console.error);