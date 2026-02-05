const fs = require('fs');
const path = require('path');

// Read the jobs.json file
const jobsPath = path.join(__dirname, '../../data/jobs.json');
const jobs = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));

// Add applyUrl to each job if it doesn't have one
const updatedJobs = jobs.map(job => {
    if (!job.applyUrl) {
        // Generate a realistic apply URL based on company and title
        const slug = job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        job.applyUrl = `https://www.linkedin.com/jobs/view/${slug}-at-${job.company.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    }
    return job;
});

// Write back to file
fs.writeFileSync(jobsPath, JSON.stringify(updatedJobs, null, 4));
console.log(`✅ Updated ${updatedJobs.length} jobs with applyUrl field`);
