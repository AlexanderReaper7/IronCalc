#![allow(clippy::unwrap_used)]

use crate::expressions::types::Area;
use crate::test::util::new_empty_model;
use crate::types::Comment;
use crate::UserModel;

#[test]
fn empty_sheet() {
    let model = UserModel::from_model(new_empty_model());
    assert_eq!(model.get_sheet_extent(0), Ok((0, 0)));
}

#[test]
fn last_value_in_each_direction() {
    let mut model = UserModel::from_model(new_empty_model());
    model.set_user_input(0, 3, 2, "a").unwrap();
    model.set_user_input(0, 9, 1, "=1+1").unwrap();
    model.set_user_input(0, 1, 5, "1").unwrap();
    assert_eq!(model.get_sheet_extent(0), Ok((9, 5)));
}

#[test]
fn a_style_alone_does_not_count() {
    let mut model = UserModel::from_model(new_empty_model());
    model.set_user_input(0, 2, 2, "a").unwrap();
    let area = Area {
        sheet: 0,
        row: 20,
        column: 10,
        width: 1,
        height: 1,
    };
    model
        .update_range_style(&area, "fill.color", "#FF0000")
        .unwrap();
    assert_eq!(model.get_sheet_extent(0), Ok((2, 2)));
}

#[test]
fn a_note_counts() {
    let mut base = new_empty_model();
    base.workbook.worksheets[0].comments.push(Comment {
        text: "note".to_string(),
        author_name: String::new(),
        author_id: None,
        cell_ref: "D12".to_string(),
    });
    let mut model = UserModel::from_model(base);
    model.set_user_input(0, 2, 2, "a").unwrap();
    assert_eq!(model.get_sheet_extent(0), Ok((12, 4)));
}

#[test]
fn deleted_values_no_longer_count() {
    let mut model = UserModel::from_model(new_empty_model());
    model.set_user_input(0, 2, 2, "a").unwrap();
    model.set_user_input(0, 30, 6, "b").unwrap();
    let area = Area {
        sheet: 0,
        row: 30,
        column: 6,
        width: 1,
        height: 1,
    };
    model.range_clear_contents(&area).unwrap();
    assert_eq!(model.get_sheet_extent(0), Ok((2, 2)));
}
