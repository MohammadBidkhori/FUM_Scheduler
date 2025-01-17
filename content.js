(function () {
    'use strict';

    // Create the weekly schedule table
    function createScheduleTable() {
        const container = document.createElement('div');
        container.id = 'schedule-container';
        container.innerHTML = `
            <h3>برنامه هفتگی شما</h3>
            <table id="schedule-table" class="table table-sm border cell-border">
                <thead>
                    <tr>
                        <th>روز</th>
                        ${Array.from({ length: 6 }, (_, i) => `<th>${8 + i * 2}-${10 + i * 2}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه']
                        .map(day => `<tr><td>${day}</td>${'<td></td>'.repeat(6)}</tr>`)
                        .join('')}
                </tbody>
            </table>
            <p id="total-units">Support us: @FumPardis</p>
            <button id="clear-schedule" class="btn btn-danger">پاک کردن</button>
        `;
        return container;
    }

    // Handle lesson selection
    function handleLessonSelection(checkBox, lessonInfo) {
        const { name, session1, session2, weekType } = parseLessonInfo(lessonInfo);
        if (checkBox.checked) {
            addLessonToSchedule(session1, name);
            if (weekType) addLessonToSchedule(session2, `${name} (${weekType})`);
            else addLessonToSchedule(session2, name);
        } else {
            removeLessonFromSchedule(session1, name);
            if (weekType) removeLessonFromSchedule(session2, `${name} (${weekType})`);
            else removeLessonFromSchedule(session2, name);
        }
    }

    // Extract lesson information
    function parseLessonInfo(info) {
        const name = info.match(/<b>شرح درس: <\/b>(.*?)<br>/)[1];
        const session1 = info.match(/<b>جلسه اول روز:<\/b>(.*?)<br>/)[1];
        const session2 = info.match(/<b>جلسه دوم روز:<\/b>(.*?)<br>/)[1];
        const weekTypeMatch = info.match(/شروع (فرد|زوج)/);
        const weekType = weekTypeMatch ? weekTypeMatch[1] : null;
        return { name, session1, session2, weekType };
    }

    // Normalize text to remove extra spaces and half-spaces
    function normalizeText(text) {
        return text.replace(/\s+|‌/g, '').trim();
    }

    // Find the row related to the day
    function findDayRow(day) {
        const normalizedDay = normalizeText(day);
        return Array.from(scheduleContainer.querySelectorAll('tr')).find(row => 
            normalizeText(row.children[0].textContent) === normalizedDay
        );
    }

    // Add lesson to the schedule
    function addLessonToSchedule(session, name) {
        const [day, time] = session.split(' ساعت ').map(str => str.trim());
        const row = findDayRow(day);

        if (!row) return;

        const startTime = parseInt(time.match(/\d+/)[0], 10);
        const colIndex = Math.floor((startTime - 8) / 2) + 1;

        if (colIndex < 1 || colIndex > 6) return;

        const cell = row.children[colIndex];
        if (cell) {
            cell.textContent += cell.textContent ? `\n${name}` : name;
        }
    }

    // Remove lesson from the schedule
    function removeLessonFromSchedule(session, name) {
        const [day, time] = session.split(' ساعت ').map(str => str.trim());
        const startTime = parseInt(time.match(/\d+/)[0], 10);
        const row = findDayRow(day);

        if (!row) return;

        const colIndex = Math.floor((startTime - 8) / 2) + 1;
        const cell = row.children[colIndex];
        if (cell) {
            const lessons = cell.textContent.split('\n').filter(lesson => lesson !== name);
            cell.textContent = lessons.join('\n');
        }
    }

    // Clear the entire schedule
    function clearSchedule() {
        document.querySelectorAll('#schedule-table tbody tr').forEach(row => {
            row.querySelectorAll('td').forEach((cell, index) => {
                if (index !== 0) cell.textContent = '';
            });
        });
        document.querySelectorAll('.lesson-checkbox').forEach(cb => cb.checked = false);
        localStorage.removeItem('selectedLessons'); // فقط selectedLessons را پاک کنید
        document.getElementById('total-units').textContent = 'Support us: @FumPardis';
    }

    // Insert the table and manage events
    const headingElement = document.querySelector('.Heading');
    if (!headingElement) return;

    const scheduleContainer = createScheduleTable();
    headingElement.insertAdjacentElement('afterend', scheduleContainer);

    // Manage the clear button
    document.getElementById('clear-schedule').addEventListener('click', clearSchedule);

    // Retrieve selectedLessons from localStorage
    let selectedLessons = JSON.parse(localStorage.getItem('selectedLessons')) || {};

    // Manage checkboxes
    document.querySelectorAll('tr').forEach((row, index) => {
        const infoIcon = row.querySelector('.fa-info-circle');
        if (infoIcon) {
            const checkBox = document.createElement('input');
            checkBox.type = 'checkbox';
            checkBox.className = 'lesson-checkbox';
            const td = document.createElement('td');
            td.appendChild(checkBox);
            row.insertBefore(td, row.firstChild);

            const lessonInfo = infoIcon.getAttribute('onclick').match(/"([^"]*)"/)[1];
            checkBox.dataset.info = lessonInfo;
            checkBox.dataset.index = index;

            // If previously selected, check the checkbox
            if (selectedLessons[index]) {
                checkBox.checked = true;
                handleLessonSelection(checkBox, lessonInfo);
            }

            // Manage checkbox changes
            checkBox.addEventListener('change', () => {
                handleLessonSelection(checkBox, lessonInfo);
                selectedLessons[index] = checkBox.checked; // به‌روزرسانی مقدار
                localStorage.setItem('selectedLessons', JSON.stringify(selectedLessons)); // ذخیره در localStorage
            });
        }
    });
})();