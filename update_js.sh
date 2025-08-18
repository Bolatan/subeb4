#!/bin/bash

# silnat and silat_1.1
LOGIC_SILNAT="
function getSurveyDisplayData(survey) {
    const formData = survey.formData || {};
    const schoolName = formData.schoolName || 'N/A';
    const respondentName = formData.silnat_a_ht_name || 'N/A';
    const lga = formData.localGov || 'N/A';
    return { schoolName, respondentName, lga };
}"
sed -i "s|function getSurveyDisplayData(survey) {.*}|${LOGIC_SILNAT}|" reports/silnat.js
sed -i "s|function getSurveyDisplayData(survey) {.*}|${LOGIC_SILNAT}|" reports/silat_1.1.js

# tcmats
LOGIC_TCMATS="
function getSurveyDisplayData(survey) {
    const formData = survey.formData || {};
    const schoolName = formData.tcmats_schoolName || 'N/A';
    const respondentName = formData.tcmats_teacherName || 'N/A';
    const lga = formData.tcmats_lgea || 'N/A';
    return { schoolName, respondentName, lga };
}"
sed -i "s|function getSurveyDisplayData(survey) {.*}|${LOGIC_TCMATS}|" reports/tcmats.js

# voices
LOGIC_VOICES="
function getSurveyDisplayData(survey) {
    const formData = survey.formData || {};
    const schoolName = formData.voices_schoolName || 'N/A';
    const respondentName = 'N/A';
    const lga = formData.voices_lgea || 'N/A';
    return { schoolName, respondentName, lga };
}"
sed -i "s|function getSurveyDisplayData(survey) {.*}|${LOGIC_VOICES}|" reports/voices.js

# silat_1.2
LOGIC_SILAT_1_2="
function getSurveyDisplayData(survey) {
    const formData = survey.formData || {};
    const schoolName = formData.silat_1_2_schoolName || 'N/A';
    const respondentName = formData.silnat_a_ht_name || 'N/A';
    const lga = formData.silat_1_2_localGov || 'N/A';
    return { schoolName, respondentName, lga };
}"
sed -i "s|function getSurveyDisplayData(survey) {.*}|${LOGIC_SILAT_1_2}|" reports/silat_1.2.js

# silat_1.3
LOGIC_SILAT_1_3="
function getSurveyDisplayData(survey) {
    const formData = survey.formData || {};
    const schoolName = formData.silat13_school_name || 'N/A';
    const respondentName = formData.silnat_a_ht_name || 'N/A';
    const lga = formData.silat13_lgea || 'N/A';
    return { schoolName, respondentName, lga };
}"
sed -i "s|function getSurveyDisplayData(survey) {.*}|${LOGIC_SILAT_1_3}|" reports/silat_1.3.js

# silat_1.4
LOGIC_SILAT_1_4="
function getSurveyDisplayData(survey) {
    const formData = survey.formData || {};
    const schoolName = formData.silat_1_4_schoolName || 'N/A';
    const respondentName = 'N/A';
    const lga = formData.silat_1_4_localGov || 'N/A';
    return { schoolName, respondentName, lga };
}"
sed -i "s|function getSurveyDisplayData(survey) {.*}|${LOGIC_SILAT_1_4}|" reports/silat_1.4.js
