const surveyData = {
  silnat_a_ht_name: 'Manual Test User',
  silnat_a_ht_contact: '0987654321',
  silnat_a_ht_gender: 'female',
  silnat_a_ht_marital_status: 'married',
  silnat_a_ht_highest_qualification: 'm_ed',
  silnat_a_ht_years_experience: '16_20',
  localGov: 'AGEGE',
  schoolName: 'AARUUN-RASHEED PRY. SCHOOL',
  schoolAddress: '456 Manual Street',
  silnat_b_location_common: 'rural',
  silnat_assemblyDevotion_startTime: '08:15',
  silnat_assemblyDevotion_endTime: '08:45',
  silnat_teachers_male: '3',
  silnat_teachers_female: '12',
  silnat_non_teaching_male: '1',
  silnat_non_teaching_female: '4',
  silnat_pupils_eccde_male: '15',
  silnat_pupils_eccde_female: '18',
  silnat_pupils_primary_male: '40',
  silnat_pupils_primary_female: '42',
  silnat_pupils_special_male: '0',
  silnat_pupils_special_female: '1',
  silnat_additional_staff_required: '2',
  silnat_multigrade_classes: '1',
  discipline_a_1_2: 'yes',
  cooperation_a_1_2: 'yes',
  communication_a_1_2: 'yes',
  community_a_1_2: 'yes',
  supervision_a_1_2: 'yes',
  records_a_1_2: 'yes',
  health_a_1_2: 'yes',
  signboard: 'available_not_good',
  teachers_furniture_available: '12',
  teachers_furniture_good: '10',
  teachers_furniture_required: '5',
};

async function submit() {
    const fetch = (await import('node-fetch')).default;

    fetch('http://localhost:3000/api/surveys/silnat_1.1', {
      method: 'POST',
      body: JSON.stringify(surveyData),
      headers: { 'Content-Type': 'application/json' }
    })
    .then(res => {
        if (!res.ok) {
            return res.text().then(text => {
                throw new Error(`Server responded with ${res.status}: ${text}`);
            });
        }
        return res.json();
    })
    .then(json => console.log('Survey submitted successfully:', json))
    .catch(err => console.error('Error submitting survey:', err));
}

submit();
